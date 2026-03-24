# Phase 5 – Tag & Search

## Goal

Implement tagging and filtering

---

## Scope

### In scope

- CRUD Tag
- Assign tag
- Filter by:
  - date
  - tag

---

## APIs

### POST /tags

### GET /tags

### POST /appointments/:id/tags

### GET /appointments?tagId=&startDate=&endDate=

---

## Business Rules

- Tag unique per user
- Many-to-many relation

---

## Edge Cases

- Duplicate tag name
- Filter empty result

---

## Done Criteria

- Tag CRUD works
- Filter works
