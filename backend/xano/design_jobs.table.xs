table design_jobs {
  description = "keeberia job queue: one row per generate request"
  schema {
    int id
    timestamp created_at?=now
    json layout
    text status?=queued
    int attempts?=0
    json artifacts?
    text error?
  }
  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "status", op: "asc"}]}
  ]
}
