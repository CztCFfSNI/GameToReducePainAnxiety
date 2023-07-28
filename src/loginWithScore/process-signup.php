<?php

if (empty($_POST["name"])) {
    die("Name is required");
}

if (empty($_POST["email"])) {
    die("Email is required");
}

if (empty($_POST["password"])) {
    die("Password is required");
}

// $name = $_POST['name'];

$mysqli = require __DIR__ . "/database.php";

// include_once("database.php");

$sql = "INSERT INTO users (name, email, password, score, gotReward) VALUES (?, ?, ?, 0, '2000-01-01');";

// mysqli_query($mysqli, $sql);

// header("Location: signup.html")
        
$stmt = $mysqli->stmt_init();

if ( ! $stmt->prepare($sql)) {
    die("SQL error: " . $mysqli->error);
}

$stmt->bind_param("sss",
                  $_POST["name"], $_POST["email"], $_POST["password"]);
              
                  
//$stmt->execute();

//echo "success";

if ($stmt->execute()) {

    header("Location: signup-success.html");
    exit;
    
} 
else {
    
    if ($mysqli->errno === 1062) {
        die("email already taken");
    } else {
        die($mysqli->error . " " . $mysqli->errno);
    }
}








