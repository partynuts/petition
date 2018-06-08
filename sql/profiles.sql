DROP TABLE if EXISTS user_profiles;

CREATE TABLE user_profiles (
id SERIAL PRIMARY KEY,
age INTEGER,
city VARCHAR(250),
url VARCHAR(250),
user_id INTEGER unique REFERENCES users(id)
);
