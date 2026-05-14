# API

Base path: `/api`

## Meet

- `GET /api/meet`
- `PUT /api/meet`

## Core Resources

- `GET /api/athletes`
- `POST /api/athletes`
- `PUT /api/athletes/:id`
- `DELETE /api/athletes/:id`

- `GET /api/events`
- `POST /api/events`
- `GET /api/events/:id/results`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`

- `GET /api/registrations`
- `POST /api/registrations`
- `DELETE /api/registrations/:id`

- `GET /api/results`
- `POST /api/results`
- `PUT /api/results/:id`
- `DELETE /api/results/:id`

## Reporting

- `GET /api/dashboard`
- `GET /api/leaderboard`
- `GET /api/results-export`
- `GET /api/reports`

## CSV Import

- `POST /api/import-athletes`

Expected body:

```json
{
  "rows": []
}
```

## Data Maintenance

- `POST /api/clear-data`

Clears athletes, events, registrations, and results, then saves the empty meet state to the database file. The meet profile is kept.

Expected body:

```json
{
  "confirm": "CLEAR"
}
```
