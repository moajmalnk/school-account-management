<?php
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$auth = require_auth();
$tenantId = tenant_id_from_auth($auth);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$type = trim((string) ($_GET['type'] ?? 'routes')); // routes | vehicles

if ($type === 'vehicles') {
    if ($method === 'GET') {
        $stmt = db()->prepare('SELECT * FROM transport_vehicles WHERE tenant_id = ? ORDER BY name');
        $stmt->execute([$tenantId]);
        json_ok(array_map('map_transport_vehicle', $stmt->fetchAll()));
    }
    if ($method === 'POST') {
        $body = read_json_body();
        $name = trim((string) ($body['name'] ?? ''));
        $reg = trim((string) ($body['registrationNo'] ?? ''));
        if ($name === '' || $reg === '') {
            json_error('name and registrationNo are required', 422);
        }
        $publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('VH');
        db()->prepare(
            'INSERT INTO transport_vehicles (
                tenant_id, public_id, name, registration_no, capacity, ownership,
                driver_name, driver_phone, route_ids, active, documents
             ) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $tenantId, $publicId, $name, $reg,
            (int) ($body['capacity'] ?? 0),
            $body['ownership'] ?? 'owned',
            $body['driverName'] ?? null,
            $body['driverPhone'] ?? null,
            json_encode($body['routeIds'] ?? []),
            bool_int($body['active'] ?? true, 1),
            isset($body['documents']) ? json_encode($body['documents']) : json_encode([]),
        ]);
        json_ok(map_transport_vehicle(require_row_for_tenant('transport_vehicles', $tenantId, $publicId)), 201);
    }
    if ($method === 'PUT' || $method === 'PATCH') {
        $body = read_json_body();
        $id = trim((string) ($body['id'] ?? ''));
        if ($id === '') {
            json_error('id is required', 422);
        }
        $row = require_row_for_tenant('transport_vehicles', $tenantId, $id);
        db()->prepare(
            'UPDATE transport_vehicles SET
                name=?, registration_no=?, capacity=?, ownership=?, driver_name=?, driver_phone=?,
                route_ids=?, active=?, documents=?
             WHERE tenant_id = ? AND public_id = ?'
        )->execute([
            $body['name'] ?? $row['name'],
            $body['registrationNo'] ?? $row['registration_no'],
            array_key_exists('capacity', $body) ? (int) $body['capacity'] : (int) $row['capacity'],
            $body['ownership'] ?? $row['ownership'],
            array_key_exists('driverName', $body) ? $body['driverName'] : $row['driver_name'],
            array_key_exists('driverPhone', $body) ? $body['driverPhone'] : $row['driver_phone'],
            array_key_exists('routeIds', $body) ? json_encode($body['routeIds']) : $row['route_ids'],
            array_key_exists('active', $body) ? bool_int($body['active'], 1) : (int) $row['active'],
            array_key_exists('documents', $body) ? json_encode($body['documents']) : $row['documents'],
            $tenantId, $id,
        ]);
        json_ok(map_transport_vehicle(require_row_for_tenant('transport_vehicles', $tenantId, $id)));
    }
    if ($method === 'DELETE') {
        $id = trim((string) ($_GET['id'] ?? read_json_body()['id'] ?? ''));
        if ($id === '') {
            json_error('id is required', 422);
        }
        require_row_for_tenant('transport_vehicles', $tenantId, $id);
        db()->prepare('DELETE FROM transport_vehicles WHERE tenant_id = ? AND public_id = ?')->execute([$tenantId, $id]);
        json_ok(['id' => $id, 'deleted' => true]);
    }
    json_error('Method not allowed', 405);
}

// routes
if ($method === 'GET') {
    $stmt = db()->prepare('SELECT * FROM transport_routes WHERE tenant_id = ? ORDER BY map_from');
    $stmt->execute([$tenantId]);
    json_ok(array_map('map_transport_route', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $body = read_json_body();
    $from = trim((string) ($body['mapFrom'] ?? ''));
    $to = trim((string) ($body['mapTo'] ?? ''));
    if ($from === '' || $to === '') {
        json_error('mapFrom and mapTo are required', 422);
    }
    $publicId = trim((string) ($body['id'] ?? '')) ?: generate_public_id('TR');
    db()->prepare(
        'INSERT INTO transport_routes (
            tenant_id, public_id, map_from, map_to, from_lat, from_lng, to_lat, to_lng,
            morning_fee, evening_fee, both_fee
         ) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $tenantId, $publicId, $from, $to,
        $body['fromLat'] ?? null, $body['fromLng'] ?? null,
        $body['toLat'] ?? null, $body['toLng'] ?? null,
        (int) ($body['morningFee'] ?? 0),
        (int) ($body['eveningFee'] ?? 0),
        (int) ($body['bothFee'] ?? 0),
    ]);
    json_ok(map_transport_route(require_row_for_tenant('transport_routes', $tenantId, $publicId)), 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $body = read_json_body();
    $id = trim((string) ($body['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    $row = require_row_for_tenant('transport_routes', $tenantId, $id);
    db()->prepare(
        'UPDATE transport_routes SET
            map_from=?, map_to=?, from_lat=?, from_lng=?, to_lat=?, to_lng=?,
            morning_fee=?, evening_fee=?, both_fee=?
         WHERE tenant_id = ? AND public_id = ?'
    )->execute([
        $body['mapFrom'] ?? $row['map_from'],
        $body['mapTo'] ?? $row['map_to'],
        array_key_exists('fromLat', $body) ? $body['fromLat'] : $row['from_lat'],
        array_key_exists('fromLng', $body) ? $body['fromLng'] : $row['from_lng'],
        array_key_exists('toLat', $body) ? $body['toLat'] : $row['to_lat'],
        array_key_exists('toLng', $body) ? $body['toLng'] : $row['to_lng'],
        array_key_exists('morningFee', $body) ? (int) $body['morningFee'] : (int) $row['morning_fee'],
        array_key_exists('eveningFee', $body) ? (int) $body['eveningFee'] : (int) $row['evening_fee'],
        array_key_exists('bothFee', $body) ? (int) $body['bothFee'] : (int) $row['both_fee'],
        $tenantId, $id,
    ]);
    json_ok(map_transport_route(require_row_for_tenant('transport_routes', $tenantId, $id)));
}

if ($method === 'DELETE') {
    $id = trim((string) ($_GET['id'] ?? read_json_body()['id'] ?? ''));
    if ($id === '') {
        json_error('id is required', 422);
    }
    require_row_for_tenant('transport_routes', $tenantId, $id);
    db()->prepare('DELETE FROM transport_routes WHERE tenant_id = ? AND public_id = ?')->execute([$tenantId, $id]);
    json_ok(['id' => $id, 'deleted' => true]);
}

json_error('Method not allowed', 405);
