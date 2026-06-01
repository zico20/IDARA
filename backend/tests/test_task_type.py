from __future__ import annotations

import pytest
from httpx import AsyncClient


async def _board_col(client: AsyncClient):
    board = (await client.post("/api/boards", json={"name": "T"})).json()
    bid = board["id"]
    cols = (await client.get(f"/api/boards/{bid}/columns")).json()
    return bid, cols[0]["id"]


@pytest.mark.asyncio
async def test_type_defaults_to_task(auth_client: AsyncClient):
    bid, col = await _board_col(auth_client)
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks?column_id={col}", json={"title": "No type"}
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["type"] == "task"


@pytest.mark.asyncio
async def test_create_with_type(auth_client: AsyncClient):
    bid, col = await _board_col(auth_client)
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks?column_id={col}",
        json={"title": "A feature", "type": "feature"},
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["type"] == "feature"


@pytest.mark.asyncio
async def test_update_type(auth_client: AsyncClient):
    bid, col = await _board_col(auth_client)
    task = (
        await auth_client.post(
            f"/api/boards/{bid}/tasks?column_id={col}", json={"title": "x"}
        )
    ).json()
    resp = await auth_client.patch(
        f"/api/boards/{bid}/tasks/{task['id']}", json={"type": "improvement"}
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["type"] == "improvement"


@pytest.mark.asyncio
async def test_invalid_type_rejected(auth_client: AsyncClient):
    bid, col = await _board_col(auth_client)
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks?column_id={col}",
        json={"title": "x", "type": "epic"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_type_in_snapshot(auth_client: AsyncClient):
    bid, col = await _board_col(auth_client)
    await auth_client.post(
        f"/api/boards/{bid}/tasks?column_id={col}",
        json={"title": "feat", "type": "feature"},
    )
    snap = (await auth_client.get(f"/api/boards/{bid}/tasks")).json()
    assert snap["columns"][0]["tasks"][0]["type"] == "feature"
