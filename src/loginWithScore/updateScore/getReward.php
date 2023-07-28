<?php
$db_host = "localhost";
$db_user = 'root';
$db_password = 'root';
$db_db = '5911test';
$db_port = 8889;

$conn = new mysqli(
  $db_host,
  $db_user,
  $db_password,
  $db_db,
  $db_port
);

if ($conn->connect_error) die("Connection failed: " . $conn->connect_error);

$userId = $_GET["id"];

$sql = "SELECT gotReward FROM users WHERE id =  " . mysqli_real_escape_string($conn, $userId);
$result = $conn->query($sql);
$row = $result->fetch_assoc();
$gotReward = $row["gotReward"];

// $data = array("gotReward" => $gotReward);
echo $gotReward;
?>
