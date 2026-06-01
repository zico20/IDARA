from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


@pytest_asyncio.fixture
async def second_client(app):
    """A separate, independently-authenticated user (added as a board member)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/auth/signup",
            json={
                "email": "member@example.com",
                "password": "password123",
                "name": "Member",
            },
        )
        assert resp.status_code == 201
        yield ac


async def _board_task(client: AsyncClient):
    board = (await client.post("/api/boards", json={"name": "T"})).json()
    bid = board["id"]
    cols = (await client.get(f"/api/boards/{bid}/columns")).json()
    task = (
        await client.post(
            f"/api/boards/{bid}/tasks?column_id={cols[0]['id']}",
            json={"title": "Parent"},
        )
    ).json()
    return bid, cols[0]["id"], task["id"]


async def _add_member(owner: AsyncClient, bid: int, role: str = "editor") -> int:
    """Add member@example.com to the board with `role`; return their user id."""
    resp = await owner.post(
        f"/api/boards/{bid}/members",
        json={"email": "member@example.com", "role": role},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["user"]["id"]


@pytest.mark.asyncio
async def test_owner_can_assign_member(
    auth_client: AsyncClient, second_client: AsyncClient
):
    bid, _col, tid = await _board_task(auth_client)
    member_id = await _add_member(auth_client, bid, "editor")

    resp = await auth_client.patch(
        f"/api/boards/{bid}/tasks/{tid}", json={"assignee_id": member_id}
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["assignee_id"] == member_id
    assert body["assignee"]["id"] == member_id
    assert body["assignee"]["email"] == "member@example.com"


@pytest.mark.asyncio
async def test_create_with_assignee(
    auth_client: AsyncClient, second_client: AsyncClient
):
    board = (await auth_client.post("/api/boards", json={"name": "T"})).json()
    bid = board["id"]
    member_id = await _add_member(auth_client, bid, "editor")
    cols = (await auth_client.get(f"/api/boards/{bid}/columns")).json()
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks?column_id={cols[0]['id']}",
        json={"title": "Assigned", "assignee_id": member_id},
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["assignee_id"] == member_id


@pytest.mark.asyncio
async def test_can_clear_assignee(
    auth_client: AsyncClient, second_client: AsyncClient
):
    bid, _col, tid = await _board_task(auth_client)
    member_id = await _add_member(auth_client, bid, "editor")
    await auth_client.patch(
        f"/api/boards/{bid}/tasks/{tid}", json={"assignee_id": member_id}
    )
    # Explicit null clears it.
    resp = await auth_client.patch(
        f"/api/boards/{bid}/tasks/{tid}", json={"assignee_id": None}
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["assignee_id"] is None
    assert resp.json()["assignee"] is None


@pytest.mark.asyncio
async def test_assign_non_member_rejected_422(auth_client: AsyncClient):
    """A user id that is not a member of the board is rejected (FR-003)."""
    bid, _col, tid = await _board_task(auth_client)
    resp = await auth_client.patch(
        f"/api/boards/{bid}/tasks/{tid}", json={"assignee_id": 999999}
    )
    assert resp.status_code == 422, resp.text
    assert resp.json()["code"] == "invalid_assignee"
    # Task left unchanged.
    task = (await auth_client.get(f"/api/boards/{bid}/tasks/{tid}")).json()
    assert task["assignee_id"] is None


@pytest.mark.asyncio
async def test_viewer_cannot_assign(
    auth_client: AsyncClient, second_client: AsyncClient
):
    bid, _col, tid = await _board_task(auth_client)
    member_id = await _add_member(auth_client, bid, "viewer")
    resp = await second_client.patch(
        f"/api/boards/{bid}/tasks/{tid}", json={"assignee_id": member_id}
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_viewer_can_read_assignee(
    auth_client: AsyncClient, second_client: AsyncClient
):
    bid, _col, tid = await _board_task(auth_client)
    member_id = await _add_member(auth_client, bid, "viewer")
    await auth_client.patch(
        f"/api/boards/{bid}/tasks/{tid}", json={"assignee_id": member_id}
    )
    snap = (await second_client.get(f"/api/boards/{bid}/tasks")).json()
    task = snap["columns"][0]["tasks"][0]
    assert task["assignee_id"] == member_id


@pytest.mark.asyncio
async def test_non_member_cannot_assign_404(
    auth_client: AsyncClient, second_client: AsyncClient
):
    bid, _col, tid = await _board_task(auth_client)
    # second_client is not a member of the board at all.
    resp = await second_client.patch(
        f"/api/boards/{bid}/tasks/{tid}", json={"assignee_id": 1}
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_removing_member_clears_assignment(
    auth_client: AsyncClient, second_client: AsyncClient
):
    """FR-007: when the assignee is removed from the board, the task survives
    and becomes unassigned (FK SET NULL on the user) — no error."""
    bid, _col, tid = await _board_task(auth_client)
    member_id = await _add_member(auth_client, bid, "editor")
    await auth_client.patch(
        f"/api/boards/{bid}/tasks/{tid}", json={"assignee_id": member_id}
    )
    # Remove the member from the board.
    rm = await auth_client.delete(f"/api/boards/{bid}/members/{member_id}")
    assert rm.status_code in (200, 204), rm.text
    # Task still exists and is now unassigned.
    task = (await auth_client.get(f"/api/boards/{bid}/tasks/{tid}")).json()
    assert task["assignee_id"] is None
