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
class DB {
    /**
     * @var array
     */
    private $config;

    private $connection;
    public function __construct() {
        $configFile = "../app/etc/env.php";
        $config = require_once $configFile;
        $this->config = $config['db']['connection']['default'];

        if (!$this->connection) {
            $this->connection = new mysqli(
                $this->config['host'],
                $this->config['username'],
                $this->config['password'],
                $this->config['dbname'],
            );
        }

        if ($this->connection->connect_error) {
            die("Connection failed: " . $this->connection->connect_error);
        }
    }
    public function insert($action, $ip) {
        $stmt = $this->connection->prepare("INSERT INTO payments_helper_analytics (action, date, ip) VALUES (?, NOW(), ?)");
        $stmt->bind_param("ss", $action,$ip);
        $stmt->execute();
        $stmt->close();
    }
    public function selectAll() {
        $query = "SELECT COUNT(action) AS count, action FROM payments_helper_analytics GROUP BY action";
        return $this->getQueryResults($query);
    }

    public function getMonthAnalytics() {
        $query = "SELECT DATE_FORMAT(date, '%Y-%m') as month, action, COUNT(*) as count FROM payments_helper_analytics GROUP BY month, action ORDER BY month DESC, action";
        return $this->getQueryResults($query);
    }

    private function getQueryResults($query) {
        $result = $this->connection->query($query);
        if ($result->num_rows > 0) {
            $data = [];
            while($row = $result->fetch_assoc()) {
                array_push($data, $row);
            }
            return $data;
        } else {
            return [];
        }
    }
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$db = new DB();

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

function getUserIP() {
    if( array_key_exists('HTTP_X_FORWARDED_FOR', $_SERVER) && !empty($_SERVER['HTTP_X_FORWARDED_FOR']) ) {
        if (strpos($_SERVER['HTTP_X_FORWARDED_FOR'], ',')>0) {
            $addr = explode(",",$_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($addr[0]);
        } else {
            return $_SERVER['HTTP_X_FORWARDED_FOR'];
        }
    }
    else {
        return $_SERVER['REMOTE_ADDR'];
    }
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (!$_POST["event"]) {
        echo "Missing data";
        header('HTTP/1.1 400 BAD REQUEST');
    }
    $event = $_POST["event"];
    $db->insert($event, getUserIP());
} else {
    $data = $db->selectAll();
    $monthlyData = $db->getMonthAnalytics();
    $aggregated = [];
    foreach ($monthlyData as $row) {
        $month = $row['month'];
        $action = $row['action'];
        $count = $row['count'];

        if (!isset($aggregated[$month])) {
            $aggregated[$month] = [];
        }
        $aggregated[$month][] = ["action" => $action, "count" => $count];
    }

    if (isset($_GET['stats'])) {
        header('Content-Type: application/json; charset=utf-8');
        if ($_GET['stats'] == 'monthly') {
            echo json_encode($monthlyData);
        } else {
            echo json_encode($data);
        }
        return;
    } else {
        $chartData = '';
        $monthlyChartsData = [];
        if ($data) {
            foreach ($data as $row) {
                $chartData .= "['{$row['action']}', {$row['count']}],\n";
            }
        }

        if ($monthlyData) {
            foreach ($monthlyData as $row) {
                $month = $row['month'];
                $action = $row['action'];
                $count = $row['count'];

                if (!isset($monthlyChartsData[$month])) {
                    $monthlyChartsData[$month] = '';
                }
                $monthlyChartsData[$month] .= "['{$row['action']}', {$row['count']}],\n";
            }
        }

        ?>
        <head>
            <script src="https://cdn.anychart.com/releases/8.12.1/js/anychart-base.min.js" type="text/javascript"></script>
        </head>
        <body>
        <div id="container" style="width: 800px; height: 600px;"></div>
        <?php
        if (count($aggregated)) {
            foreach ($aggregated as $month => $monthData) {
                echo "<div id='container-$month' style='width: 800px; height: 600px;'></div>";
            }
        }
        ?>
        </body>
        <script>
            anychart.onDocumentLoad(function () {
                var chart = anychart.pie();
                chart.data([<?php echo $chartData; ?>]);
                chart.title("Payment Services Extension Analytics");
                chart.container("container");
                chart.draw();

                <?php
                foreach ($monthlyChartsData as $month => $data) {
                ?>
                var chart = anychart.bar();
                chart.data([<?php echo $data; ?>]);
                chart.title("Payment Services Extension Analytics for <?= $month ?>");
                chart.container("container-<?= $month ?>");
                chart.draw();
                <?php
                }
                ?>
            });
        </script>
        <?php
    }
}
