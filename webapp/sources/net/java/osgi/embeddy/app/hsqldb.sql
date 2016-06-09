
/* Objects */

create cached table if not exists Objects
(
  pkey  uuid not null primary key,
  owner uuid,
  ts    timestamp not null,
  type  varchar (255),
  text  varchar (1024),
  json  varbinary (524288),
  file  blob,

  constraint fk_objects_owner foreign key (owner)
    references Objects (pkey) on delete cascade
);

create index if not exists ix_objects_ts
  on Objects (ts);

create index if not exists ix_objects_owner
  on Objects (owner);

create index if not exists ix_objects_type_ts
  on Objects (type, ts);
