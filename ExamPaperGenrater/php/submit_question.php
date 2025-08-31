<?php
include 'db.php';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $question_text = $_POST['question_text'];
    $difficulty = $_POST['difficulty'];
    $blooms_taxonomy = $_POST['blooms_taxonomy'];
    $subject_code = $_POST['subject_code'];
    $subject_name = $_POST['subject_name'];
    $max_time = $_POST['max_time'];
    $marks = $_POST['marks'];

    // Validate input
    if (empty($question_text) || empty($difficulty) || empty($blooms_taxonomy) || empty($subject_code) || empty($subject_name) || empty($max_time) || empty($marks)) {
        die("Error: All fields are required.");
    }

    // Debugging: Print values
    var_dump($question_text, $difficulty, $blooms_taxonomy, $subject_code, $subject_name, $max_time, $marks);

    $stmt = $conn->prepare("INSERT INTO questions (question_text, difficulty, blooms_taxonomy, subject_code, subject_name, max_time, marks) VALUES (?, ?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        die("Error preparing statement: " . $conn->error);
    }
    
    $stmt->bind_param("sisssii", $question_text, $difficulty, $blooms_taxonomy, $subject_code, $subject_name, $max_time, $marks);

    if ($stmt->execute()) {
        echo "Question submitted successfully!";
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>
