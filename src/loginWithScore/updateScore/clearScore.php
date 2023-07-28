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

$sql = "UPDATE users SET score = 0 WHERE id = " . mysqli_real_escape_string($conn, $userId);
$conn->query($sql);

$conn->close();
?>