# API Contract Delta: Tasks Power Features & Analytics

Only the Task endpoints change, and only additively. No new endpoints. Analytics and Calendar are computed client-side from the existing board snapshot + members — **no new API**.

## Affected endpoints (existing)

### Create task — `POST /api/boards/{board_id}/tasks?column_id={column_id}`

**Request body (additive fields)**:

```jsonc
{
  "title": "Finalize RFP evaluation matrix",
  "description": null,
  "due_date": "2026-04-15T00:00:00Z",
  "priority": "high",
  "label_ids": [1, 2],
  "assignee_id": 7,          // NEW — optional; must be a member of {board_id}
  "type": "feature"          // NEW — optional; one of task|feature|improvement; default "task"
}
```

### Update task — `PATCH /api/tasks/{task_id}`

Partial update; the two new fields are independently settable:

```jsonc
{ "assignee_id": null }       // clear the assignee
{ "assignee_id": 7 }          // (re)assign — must be a board member
{ "type": "improvement" }     // change type
```

### Response — `TaskPublic` (additive fields)

```jsonc
{
  "id": 42,
  "column_id": 3,
  "title": "Finalize RFP evaluation matrix",
  "description": null,
  "due_date": "2026-04-15T00:00:00Z",
  "priority": "high",
  "position": 0,
  "created_at": "...",
  "updated_at": "...",
  "labels": [ /* ... */ ],
  "checklist_done": 1,
  "checklist_total": 3,
  "assignee_id": 7,                                  // NEW
  "type": "feature",                                 // NEW
  "assignee": {                                      // NEW — null when unassigned
    "id": 7, "email": "ben.okonkwo@example.com",
    "name": "Ben Okonkwo", "avatar_url": null, "created_at": "..."
  }
}
```

## Permissions

| Caller role | Set/clear assignee or type | Read assignee/type |
|-------------|----------------------------|--------------------|
| owner / editor | ✅ allowed | ✅ |
| viewer | ❌ 403 | ✅ |
| non-member | ❌ 404 (existence not leaked) | ❌ 404 |

## Error responses (structured `{error, code, details?}`)

| Condition | Status | code |
|-----------|--------|------|
| `assignee_id` not a member of the board | 422 | `invalid_assignee` |
| `type` not in `task\|feature\|improvement` | 422 | (Pydantic validation error shape) |
| viewer attempts a write | 403 | (existing forbidden code) |
| non-member touches the board | 404 | (existing not-found code) |

## Real-time (WebSocket) — unchanged channel

- Create → broadcast `task.created` with full `TaskPublic` (now including `assignee`/`type`) + `actor_id`.
- Update → broadcast `task.updated` with full `TaskPublic` + `actor_id`.
- Clients ignore their own echo by `actor_id` and replace the task in the snapshot by id (new fields propagate automatically). **No new WS message types.**
