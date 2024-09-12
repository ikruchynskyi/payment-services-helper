<?php
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
if (!file_exists('access.log')) {
    file_put_contents('access.log', '');
}
$txt = getUserIP() . " ". $_SERVER['REQUEST_METHOD'];
file_put_contents('access.log', $txt.PHP_EOL , FILE_APPEND | LOCK_EX);

$logFile = "data.log";
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    echo "Deleted";
    file_put_contents($logFile, "{}");
}
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (!$_POST["event"]) {
        echo "Missing data";
        header('HTTP/1.1 400 BAD REQUEST');
    }
    $db = file_get_contents($logFile);
    $event = $_POST["event"];

    if (!file_exists($logFile)) {
        file_put_contents($logFile, json_encode([]));
    }
    $logData = json_decode(file_get_contents($logFile), true);

    if (!isset($logData[$event])) {
        $logData[$event] = 0;
    }

    $logData[$event]++;
    file_put_contents($logFile, json_encode($logData));
} else {
    $chartData = '';
    if (file_exists($logFile)) {
        $fileContents = file_get_contents($logFile);
        $data = json_decode($fileContents, true);
        if ($data !== null) {
            foreach ($data as $key => $value) {
                $chartData .= "['$key', $value],\n";
            }
        }
    }
    ?>
    <head>
        <script src="https://cdn.anychart.com/releases/8.12.1/js/anychart-base.min.js" type="text/javascript"></script>
    </head>
    <body>
    <div id="container" style="width: 800px; height: 600px;"></div>
    </body>
    <script>
        anychart.onDocumentLoad(function () {
            var chart = anychart.pie();
            chart.data([<?php echo $chartData; ?>]);
            chart.title("Payment Services Extension Analytics");
            chart.container("container");
            chart.draw();
        });
    </script>
    <?php
}