
/* Objects */

create cached table if not exists Objects
(
  pkey  uuid not null primary key,
  ts    timestamp not null,
  type  varchar (255),
  text  varchar (1024),
  json  varbinary (524288),
  file  blob
);

create index if not exists ix_objects_ts
  on Objects (ts);

create index if not exists ix_objects_type_ts
  on Objects (type, ts);
