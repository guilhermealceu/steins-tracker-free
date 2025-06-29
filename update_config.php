<?php
header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);
file_put_contents('jogos_log.json', json_encode($data));
echo json_encode(['success' => true]);
?>