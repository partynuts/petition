drop table if exists signatures;


Create Table signatures (
id serial primary key,
signature text not null,
user_id INTEGER not null unique REFERENCES users(id)
);
