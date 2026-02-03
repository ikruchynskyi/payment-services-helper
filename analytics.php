<?php
/**
 * CREATE TABLE `payments_helper_analytics` (
 * `id` INT NOT NULL AUTO_INCREMENT,
 * `action` VARCHAR(32) NOT NULL COMMENT 'Payment Helper button',
 * `date` TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
 * `ip` VARCHAR(15),
 * KEY `action_index` (`action`) USING BTREE,
 * KEY `ip_index` (`ip`) USING BTREE,
 * PRIMARY KEY (`id`)
 * );
 */

declare(strict_types=1);

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

class AnalyticsDB
{
    private mysqli $connection;

    public function __construct()
    {
        $configFile = dirname(__DIR__) . '/app/etc/env.php';
        $config = require $configFile;
        $db = $config['db']['connection']['default'] ?? [];

        $host = $db['host'] ?? 'localhost';
        $username = $db['username'] ?? '';
        $password = $db['password'] ?? '';
        $dbname = $db['dbname'] ?? '';
        $port = isset($db['port']) ? (int) $db['port'] : (int) ini_get('mysqli.default_port');

        $this->connection = new mysqli($host, $username, $password, $dbname, $port);
        $this->connection->set_charset('utf8mb4');
    }

    public function insertEvent(string $action, ?string $ip): void
    {
        $stmt = $this->connection->prepare(
            'INSERT INTO payments_helper_analytics (action, date, ip) VALUES (?, NOW(), ?)'
        );
        $stmt->bind_param('ss', $action, $ip);
        $stmt->execute();
        $stmt->close();
    }

    public function getOverallCounts(): array
    {
        $query = 'SELECT COUNT(action) AS count, action FROM payments_helper_analytics GROUP BY action';
        return $this->queryAll($query);
    }

    public function getMonthlyCounts(): array
    {
        $query = "SELECT DATE_FORMAT(date, '%Y-%m') as month, action, COUNT(*) as count FROM payments_helper_analytics GROUP BY month, action ORDER BY month DESC, action";
        return $this->queryAll($query);
    }

    public function getEventList(): array
    {
        $rows = $this->queryAll('SELECT DISTINCT action FROM payments_helper_analytics ORDER BY action');
        $events = [];
        foreach ($rows as $row) {
            $events[] = $row['action'];
        }
        return $events;
    }

    public function getSummary(?string $start, ?string $end, ?string $event): array
    {
        [$where, $types, $params] = $this->buildWhere($start, $end, $event);
        $summaryRows = $this->queryAll(
            "SELECT COUNT(*) AS total_events, COUNT(DISTINCT ip) AS unique_reach FROM payments_helper_analytics $where",
            $types,
            $params
        );

        $summary = $summaryRows[0] ?? ['total_events' => 0, 'unique_reach' => 0];
        $summary['total_events'] = (int) $summary['total_events'];
        $summary['unique_reach'] = (int) $summary['unique_reach'];
        $summary['avg_events_per_reach'] = $summary['unique_reach'] > 0
            ? round($summary['total_events'] / $summary['unique_reach'], 2)
            : 0;

        $topRows = $this->queryAll(
            "SELECT action, COUNT(*) AS events, COUNT(DISTINCT ip) AS reach FROM payments_helper_analytics $where GROUP BY action ORDER BY events DESC LIMIT 1",
            $types,
            $params
        );

        if ($topRows) {
            $summary['top_event'] = $topRows[0]['action'];
            $summary['top_event_events'] = (int) $topRows[0]['events'];
            $summary['top_event_reach'] = (int) $topRows[0]['reach'];
        } else {
            $summary['top_event'] = null;
            $summary['top_event_events'] = 0;
            $summary['top_event_reach'] = 0;
        }

        return $summary;
    }

    public function getTimeSeries(?string $start, ?string $end, ?string $event, string $group): array
    {
        [$where, $types, $params] = $this->buildWhere($start, $end, $event);
        $groupExpr = $this->groupExpression($group);

        $query = "SELECT $groupExpr AS bucket, COUNT(*) AS events, COUNT(DISTINCT ip) AS reach FROM payments_helper_analytics $where GROUP BY bucket ORDER BY bucket";
        return $this->queryAll($query, $types, $params);
    }

    public function getTopEvents(?string $start, ?string $end, ?string $event, int $limit): array
    {
        [$where, $types, $params] = $this->buildWhere($start, $end, $event);
        $limit = max(1, min($limit, 25));
        $query = "SELECT action, COUNT(*) AS events, COUNT(DISTINCT ip) AS reach FROM payments_helper_analytics $where GROUP BY action ORDER BY events DESC LIMIT $limit";
        return $this->queryAll($query, $types, $params);
    }

    public function getEventBreakdown(?string $start, ?string $end): array
    {
        [$where, $types, $params] = $this->buildWhere($start, $end, null);
        $query = "SELECT action, COUNT(*) AS events, COUNT(DISTINCT ip) AS reach FROM payments_helper_analytics $where GROUP BY action ORDER BY events DESC";
        return $this->queryAll($query, $types, $params);
    }

    private function groupExpression(string $group): string
    {
        switch ($group) {
            case 'day':
                return "DATE_FORMAT(date, '%Y-%m-%d')";
            case 'week':
                return "DATE_FORMAT(DATE_SUB(date, INTERVAL WEEKDAY(date) DAY), '%Y-%m-%d')";
            case 'month':
            default:
                return "DATE_FORMAT(date, '%Y-%m')";
        }
    }

    private function buildWhere(?string $start, ?string $end, ?string $event): array
    {
        $where = [];
        $types = '';
        $params = [];

        if ($start !== null) {
            $where[] = 'date >= ?';
            $types .= 's';
            $params[] = $start . ' 00:00:00';
        }

        if ($end !== null) {
            $where[] = 'date <= ?';
            $types .= 's';
            $params[] = $end . ' 23:59:59';
        }

        if ($event !== null) {
            $where[] = 'action = ?';
            $types .= 's';
            $params[] = $event;
        }

        $sql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
        return [$sql, $types, $params];
    }

    private function queryAll(string $sql, string $types = '', array $params = []): array
    {
        $stmt = $this->connection->prepare($sql);
        if ($types !== '') {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $rows = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $rows[] = $row;
            }
        }
        $stmt->close();
        return $rows;
    }
}

function noCacheHeaders(): void
{
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Cache-Control: post-check=0, pre-check=0', false);
    header('Pragma: no-cache');
}

function respondText(string $text, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: text/plain; charset=utf-8');
    echo $text;
    exit;
}

function respondJson(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function respondCsv(array $rows, array $headers, string $filename): void
{
    http_response_code(200);
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    $output = fopen('php://output', 'w');
    fputcsv($output, $headers);
    foreach ($rows as $row) {
        $line = [];
        foreach ($headers as $header) {
            $line[] = $row[$header] ?? '';
        }
        fputcsv($output, $line);
    }
    fclose($output);
    exit;
}

function normalizeDate(?string $value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    $date = DateTime::createFromFormat('Y-m-d', $value);
    if ($date === false) {
        return null;
    }

    return $date->format('Y-m-d') === $value ? $value : null;
}

function normalizeRange(?string $start, ?string $end): array
{
    $start = normalizeDate($start);
    $end = normalizeDate($end);

    if ($start !== null && $end !== null && $start > $end) {
        [$start, $end] = [$end, $start];
    }

    return [$start, $end];
}

function normalizeEvent(?string $event): ?string
{
    if ($event === null) {
        return null;
    }

    $event = trim((string) $event);
    if ($event === '' || strtolower($event) === 'all') {
        return null;
    }

    if (strlen($event) > 32) {
        $event = substr($event, 0, 32);
    }

    return $event;
}

function normalizeGroup(?string $group): string
{
    $group = strtolower((string) $group);
    if (in_array($group, ['day', 'week', 'month'], true)) {
        return $group;
    }
    return 'month';
}

function getUserIP(): ?string
{
    $ip = null;
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        $ip = $_SERVER['HTTP_X_REAL_IP'];
    } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
        $ip = $_SERVER['REMOTE_ADDR'];
    }

    if ($ip === null) {
        return null;
    }

    if (strpos($ip, ',') !== false) {
        $parts = explode(',', $ip);
        $ip = trim($parts[0]);
    }

    $ip = trim($ip);
    if ($ip === '') {
        return null;
    }

    if (strlen($ip) > 15) {
        $ip = substr($ip, 0, 15);
    }

    return $ip;
}

function getEventFromRequest(): ?string
{
    $event = $_POST['event'] ?? null;
    if ($event === null) {
        $raw = file_get_contents('php://input');
        if ($raw) {
            $payload = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($payload)) {
                $event = $payload['event'] ?? null;
            }
        }
    }

    return normalizeEvent($event);
}

function handleLegacyStats(AnalyticsDB $db): void
{
    header('Content-Type: application/json; charset=utf-8');
    if (isset($_GET['stats']) && $_GET['stats'] === 'monthly') {
        echo json_encode($db->getMonthlyCounts());
    } else {
        echo json_encode($db->getOverallCounts());
    }
    exit;
}

function buildReport(AnalyticsDB $db, ?string $start, ?string $end, ?string $event, string $group): array
{
    if ($event !== null) {
        $rows = $db->getTimeSeries($start, $end, $event, $group);
        return [
            'mode' => 'timeseries',
            'headers' => ['bucket', 'events', 'reach'],
            'rows' => $rows,
        ];
    }

    $rows = $db->getEventBreakdown($start, $end);
    return [
        'mode' => 'events',
        'headers' => ['action', 'events', 'reach'],
        'rows' => $rows,
    ];
}

function handleApi(AnalyticsDB $db): void
{
    $api = $_GET['api'] ?? 'dashboard';
    if ($api === '1' || $api === '') {
        $api = 'dashboard';
    }

    [$start, $end] = normalizeRange($_GET['start'] ?? null, $_GET['end'] ?? null);
    $event = normalizeEvent($_GET['event'] ?? null);
    $group = normalizeGroup($_GET['group'] ?? null);
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;
    $limit = max(1, min($limit, 25));
    $format = $_GET['format'] ?? 'json';

    if ($api === 'events') {
        respondJson(['events' => $db->getEventList()]);
    }

    if ($api === 'summary') {
        respondJson(['summary' => $db->getSummary($start, $end, $event)]);
    }

    if ($api === 'timeseries') {
        respondJson([
            'group' => $group,
            'timeseries' => $db->getTimeSeries($start, $end, $event, $group),
        ]);
    }

    if ($api === 'top') {
        respondJson(['top_events' => $db->getTopEvents($start, $end, $event, $limit)]);
    }

    if ($api === 'report') {
        $report = buildReport($db, $start, $end, $event, $group);
        if ($format === 'csv') {
            $filename = $report['mode'] === 'timeseries'
                ? 'analytics-report-timeseries.csv'
                : 'analytics-report-events.csv';
            respondCsv($report['rows'], $report['headers'], $filename);
        }
        respondJson(['report' => $report]);
    }

    $report = buildReport($db, $start, $end, $event, $group);
    respondJson([
        'meta' => [
            'start' => $start,
            'end' => $end,
            'group' => $group,
            'event' => $event,
        ],
        'events' => $db->getEventList(),
        'summary' => $db->getSummary($start, $end, $event),
        'timeseries' => $db->getTimeSeries($start, $end, $event, $group),
        'top_events' => $db->getTopEvents($start, $end, $event, $limit),
        'report' => $report,
    ]);
}

function handleIngest(AnalyticsDB $db): void
{
    $event = getEventFromRequest();
    if ($event === null) {
        respondText('Missing data', 400);
    }

    $ip = getUserIP();
    $db->insertEvent($event, $ip);
    respondText('ok', 200);
}

noCacheHeaders();
$db = new AnalyticsDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handleIngest($db);
}

if (isset($_GET['stats'])) {
    handleLegacyStats($db);
}

if (isset($_GET['api'])) {
    handleApi($db);
}

?><!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payment Services Analytics</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" crossorigin="anonymous"></script>
    <style>
        :root {
            color-scheme: light;
            --bg: #0f1b2d;
            --surface: #16263c;
            --surface-2: #1a2f4b;
            --surface-3: #203757;
            --accent: #f8b195;
            --accent-2: #f67280;
            --accent-3: #c06c84;
            --text: #f7f6f2;
            --muted: #b6c0d4;
            --stroke: rgba(255, 255, 255, 0.1);
            --success: #7bdff2;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: 'Space Grotesk', system-ui, sans-serif;
            background: radial-gradient(circle at top, #1c3152 0%, var(--bg) 55%, #0c1424 100%);
            color: var(--text);
        }

        .page {
            max-width: 1200px;
            margin: 0 auto;
            padding: 32px 20px 80px;
        }

        header {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 28px;
        }

        header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
        }

        header p {
            margin: 0;
            color: var(--muted);
        }

        .controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            padding: 20px;
            background: var(--surface);
            border: 1px solid var(--stroke);
            border-radius: 16px;
            margin-bottom: 24px;
        }

        .control {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .control label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--muted);
        }

        .control input,
        .control select {
            background: var(--surface-2);
            border: 1px solid var(--stroke);
            color: var(--text);
            padding: 10px 12px;
            border-radius: 10px;
            font-size: 14px;
        }

        .control button {
            background: linear-gradient(120deg, var(--accent), var(--accent-2));
            border: none;
            color: #2a1c24;
            padding: 11px 14px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
        }

        .quick-buttons {
            grid-column: 1 / -1;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .quick-buttons button {
            background: var(--surface-2);
            color: var(--text);
            border: 1px solid var(--stroke);
            padding: 8px 12px;
            border-radius: 999px;
            cursor: pointer;
            font-size: 13px;
        }

        .kpis {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 26px;
        }

        .kpi {
            background: var(--surface-2);
            border: 1px solid var(--stroke);
            border-radius: 16px;
            padding: 18px;
            position: relative;
            overflow: hidden;
        }

        .kpi::after {
            content: '';
            position: absolute;
            right: -30px;
            top: -30px;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: radial-gradient(circle at center, rgba(255, 255, 255, 0.2), transparent 70%);
        }

        .kpi h3 {
            margin: 0 0 6px;
            font-size: 14px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .kpi .value {
            font-size: 26px;
            font-weight: 700;
        }

        .kpi .sub {
            margin-top: 6px;
            color: var(--muted);
            font-size: 13px;
        }

        .panels {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 18px;
            margin-bottom: 28px;
        }

        .panel {
            background: var(--surface);
            border: 1px solid var(--stroke);
            border-radius: 16px;
            padding: 18px;
        }

        .panel h2 {
            margin: 0 0 12px;
            font-size: 18px;
        }

        .panel canvas {
            width: 100% !important;
            height: 280px !important;
        }

        .report {
            background: var(--surface);
            border: 1px solid var(--stroke);
            border-radius: 18px;
            padding: 18px;
        }

        .report-header {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 12px;
        }

        .report-header h2 {
            margin: 0;
            font-size: 18px;
        }

        .report-header a {
            color: var(--text);
            text-decoration: none;
            background: var(--surface-2);
            border: 1px solid var(--stroke);
            padding: 8px 12px;
            border-radius: 10px;
            font-size: 13px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }

        th,
        td {
            text-align: left;
            padding: 10px 8px;
            border-bottom: 1px solid var(--stroke);
        }

        th {
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-size: 12px;
        }

        .footer-note {
            margin-top: 18px;
            color: var(--muted);
            font-size: 12px;
        }

        @media (max-width: 720px) {
            header h1 {
                font-size: 26px;
            }

            .panel canvas {
                height: 220px !important;
            }
        }
    </style>
</head>
<body>
<div class="page">
    <header>
        <h1>Payment Services Analytics</h1>
        <p>Reach-focused overview with filters for time, event, and reporting exports.</p>
    </header>

    <section class="controls">
        <div class="control">
            <label for="startDate">Start date</label>
            <input type="date" id="startDate" />
        </div>
        <div class="control">
            <label for="endDate">End date</label>
            <input type="date" id="endDate" />
        </div>
        <div class="control">
            <label for="eventSelect">Event</label>
            <select id="eventSelect"></select>
        </div>
        <div class="control">
            <label for="groupSelect">Group by</label>
            <select id="groupSelect">
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month" selected>Month</option>
            </select>
        </div>
        <div class="control">
            <label>&nbsp;</label>
            <button id="applyFilters">Apply filters</button>
        </div>
        <div class="quick-buttons">
            <button data-range="7">Last 7 days</button>
            <button data-range="30">Last 30 days</button>
            <button data-range="90">Last 90 days</button>
            <button data-range="ytd">Year to date</button>
        </div>
    </section>

    <section class="kpis">
        <div class="kpi">
            <h3>Total Events</h3>
            <div class="value" id="kpiTotal">0</div>
            <div class="sub" id="kpiTotalSub">All selected events</div>
        </div>
        <div class="kpi">
            <h3>Unique Reach</h3>
            <div class="value" id="kpiReach">0</div>
            <div class="sub" id="kpiReachSub">Unique IPs</div>
        </div>
        <div class="kpi">
            <h3>Avg Events / Reach</h3>
            <div class="value" id="kpiAvg">0</div>
            <div class="sub" id="kpiAvgSub">Intensity score</div>
        </div>
        <div class="kpi">
            <h3>Top Event</h3>
            <div class="value" id="kpiTop">-</div>
            <div class="sub" id="kpiTopSub">No data yet</div>
        </div>
    </section>

    <section class="panels">
        <div class="panel">
            <h2>Activity Over Time</h2>
            <canvas id="trendChart"></canvas>
        </div>
        <div class="panel">
            <h2>Top Events by Reach</h2>
            <canvas id="topChart"></canvas>
        </div>
    </section>

    <section class="report">
        <div class="report-header">
            <h2 id="reportTitle">Report</h2>
            <a id="downloadCsv" href="#">Download CSV</a>
        </div>
        <div style="overflow-x: auto;">
            <table>
                <thead id="reportHead"></thead>
                <tbody id="reportBody"></tbody>
            </table>
        </div>
        <div class="footer-note" id="footerNote">Data updates in real time. Dates follow server timezone.</div>
    </section>
</div>

<script>
    const state = {
        start: null,
        end: null,
        event: 'all',
        group: 'month',
        limit: 10,
    };

    const elements = {
        startDate: document.getElementById('startDate'),
        endDate: document.getElementById('endDate'),
        eventSelect: document.getElementById('eventSelect'),
        groupSelect: document.getElementById('groupSelect'),
        applyFilters: document.getElementById('applyFilters'),
        kpiTotal: document.getElementById('kpiTotal'),
        kpiReach: document.getElementById('kpiReach'),
        kpiAvg: document.getElementById('kpiAvg'),
        kpiTop: document.getElementById('kpiTop'),
        kpiTopSub: document.getElementById('kpiTopSub'),
        reportHead: document.getElementById('reportHead'),
        reportBody: document.getElementById('reportBody'),
        reportTitle: document.getElementById('reportTitle'),
        downloadCsv: document.getElementById('downloadCsv'),
    };

    let trendChart = null;
    let topChart = null;

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatNumber(value) {
        return new Intl.NumberFormat().format(value || 0);
    }

    function setRange(days) {
        const today = new Date();
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        let start;

        if (days === 'ytd') {
            start = new Date(today.getFullYear(), 0, 1);
        } else {
            start = new Date(end.getTime() - (days - 1) * 86400000);
        }

        elements.startDate.value = formatDate(start);
        elements.endDate.value = formatDate(end);
    }

    function buildApiUrl(api) {
        const url = new URL(window.location.href);
        url.searchParams.set('api', api);
        if (state.start) {
            url.searchParams.set('start', state.start);
        } else {
            url.searchParams.delete('start');
        }
        if (state.end) {
            url.searchParams.set('end', state.end);
        } else {
            url.searchParams.delete('end');
        }
        if (state.event && state.event !== 'all') {
            url.searchParams.set('event', state.event);
        } else {
            url.searchParams.delete('event');
        }
        url.searchParams.set('group', state.group);
        url.searchParams.set('limit', state.limit);
        url.searchParams.delete('stats');
        return url.toString();
    }

    function updateSummary(summary) {
        elements.kpiTotal.textContent = formatNumber(summary.total_events);
        elements.kpiReach.textContent = formatNumber(summary.unique_reach);
        const avg = Number(summary.avg_events_per_reach || 0);
        elements.kpiAvg.textContent = avg.toFixed(2);

        if (summary.top_event) {
            elements.kpiTop.textContent = summary.top_event;
            elements.kpiTopSub.textContent = `${formatNumber(summary.top_event_events)} events`;
        } else {
            elements.kpiTop.textContent = '-';
            elements.kpiTopSub.textContent = 'No data yet';
        }
    }

    function renderTrend(timeseries) {
        const labels = timeseries.map(row => row.bucket);
        const events = timeseries.map(row => Number(row.events));
        const reach = timeseries.map(row => Number(row.reach));

        const data = {
            labels,
            datasets: [
                {
                    label: 'Events',
                    data: events,
                    borderColor: '#f67280',
                    backgroundColor: 'rgba(246, 114, 128, 0.3)',
                    tension: 0.3,
                    fill: true,
                },
                {
                    label: 'Reach',
                    data: reach,
                    borderColor: '#7bdff2',
                    backgroundColor: 'rgba(123, 223, 242, 0.2)',
                    tension: 0.3,
                    fill: true,
                }
            ]
        };

        const options = {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#f7f6f2' } },
            },
            scales: {
                x: { ticks: { color: '#b6c0d4' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#b6c0d4' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            },
        };

        if (trendChart) {
            trendChart.data = data;
            trendChart.options = options;
            trendChart.update();
            return;
        }

        const ctx = document.getElementById('trendChart');
        trendChart = new Chart(ctx, { type: 'line', data, options });
    }

    function renderTop(topEvents) {
        const labels = topEvents.map(row => row.action);
        const events = topEvents.map(row => Number(row.events));
        const reach = topEvents.map(row => Number(row.reach));

        const data = {
            labels,
            datasets: [
                {
                    label: 'Events',
                    data: events,
                    backgroundColor: 'rgba(248, 177, 149, 0.7)',
                },
                {
                    label: 'Reach',
                    data: reach,
                    backgroundColor: 'rgba(123, 223, 242, 0.7)',
                }
            ]
        };

        const options = {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#f7f6f2' } },
            },
            scales: {
                x: { ticks: { color: '#b6c0d4' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#b6c0d4' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            },
        };

        if (topChart) {
            topChart.data = data;
            topChart.options = options;
            topChart.update();
            return;
        }

        const ctx = document.getElementById('topChart');
        topChart = new Chart(ctx, { type: 'bar', data, options });
    }

    function renderReport(report) {
        const headers = report.headers || [];
        const rows = report.rows || [];
        elements.reportHead.innerHTML = '';
        elements.reportBody.innerHTML = '';

        const headRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header.replace(/_/g, ' ');
            headRow.appendChild(th);
        });
        elements.reportHead.appendChild(headRow);

        rows.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                const value = row[header];
                if (header === 'events' || header === 'reach') {
                    td.textContent = formatNumber(value);
                } else {
                    td.textContent = value;
                }
                tr.appendChild(td);
            });
            elements.reportBody.appendChild(tr);
        });

        elements.reportTitle.textContent = report.mode === 'timeseries'
            ? `Report for ${state.event}`
            : 'Report by event';
    }

    function updateDownloadLink() {
        const url = new URL(buildApiUrl('report'));
        url.searchParams.set('format', 'csv');
        elements.downloadCsv.href = url.toString();
    }

    function updateFiltersFromUI() {
        state.start = elements.startDate.value || null;
        state.end = elements.endDate.value || null;
        state.event = elements.eventSelect.value || 'all';
        state.group = elements.groupSelect.value || 'month';
    }

    async function loadDashboard() {
        updateFiltersFromUI();
        const response = await fetch(buildApiUrl('dashboard'));
        const payload = await response.json();
        if (payload.events) {
            renderEventOptions(payload.events);
        }
        updateSummary(payload.summary || {});
        renderTrend(payload.timeseries || []);
        renderTop(payload.top_events || []);
        renderReport(payload.report || { headers: [], rows: [] });
        updateDownloadLink();
    }

    function renderEventOptions(events) {
        if (!events || !events.length) {
            events = [];
        }

        const current = elements.eventSelect.value || 'all';
        elements.eventSelect.innerHTML = '';
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All events';
        elements.eventSelect.appendChild(allOption);

        events.forEach(eventName => {
            const option = document.createElement('option');
            option.value = eventName;
            option.textContent = eventName;
            elements.eventSelect.appendChild(option);
        });

        elements.eventSelect.value = current;
    }

    elements.applyFilters.addEventListener('click', () => {
        loadDashboard();
    });

    document.querySelectorAll('.quick-buttons button').forEach(button => {
        button.addEventListener('click', () => {
            const range = button.getAttribute('data-range');
            setRange(range === 'ytd' ? 'ytd' : Number(range));
            loadDashboard();
        });
    });

    function init() {
        setRange(30);
        loadDashboard();
    }

    init();
</script>
</body>
</html>
