<?php

$db_host = "localhost";
$db_user = 'root';
$db_password = 'root';
$db_db = '5911test';
$db_port = 8889;

$mysqli = new mysqli(
  $db_host,
  $db_user,
  $db_password,
  $db_db,
  $db_port
);
                     
if ($mysqli->connect_errno) die("Connection error: " . $mysqli->connect_error);

return $mysqli;