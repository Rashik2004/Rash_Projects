<?php
include 'db.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $subject_code = $_POST['subject_code'];
    $subject_name = $_POST['subject_name'];
    $total_marks = $_POST['total_marks'];
    $total_time = $_POST['total_time'];

    $num_questions = $_POST['num_questions'];
    $difficulty = $_POST['difficulty'];
    $blooms_taxonomy = $_POST['blooms_taxonomy'];
    $marks_per_question = $_POST['marks_per_question'];

    $total_marks_allocated = 0;
    $total_time_allocated = 0;
    $questions_selected = [];

    for ($i = 0; $i < count($num_questions); $i++) {
        $query = "SELECT * FROM questions WHERE subject_code = ? AND difficulty = ? AND blooms_taxonomy = ? AND marks = ? LIMIT ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("sisii", $subject_code, $difficulty[$i], $blooms_taxonomy[$i], $marks_per_question[$i], $num_questions[$i]);
        $stmt->execute();
        $result = $stmt->get_result();

        while ($row = $result->fetch_assoc()) {
            $questions_selected[] = $row;
            $total_marks_allocated += $row['marks'];
            $total_time_allocated += $row['max_time'];
        }

        $stmt->close();
    }

    if ($total_marks_allocated > $total_marks || $total_time_allocated > $total_time) {
        echo "Error: Total marks or time exceeded.";
    } else {
        echo "<h3>Generated Question Paper</h3>";
        foreach ($questions_selected as $question) {
            echo "<p>{$question['question_text']} (Marks: {$question['marks']}, Time: {$question['max_time']} mins)</p>";
        }
    }

    $conn->close();
}
?>
