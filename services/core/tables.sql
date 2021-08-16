create table if not exists users
(
	id integer generated always as identity
		constraint users_pkey
			primary key,
	email varchar(64) not null
		constraint users_email_key
			unique,
	hash varchar(60) not null,
	subscription_end bigint,
	stripe_customer_id varchar(255),
	google_credentials jsonb,
	spreadsheet_id varchar(64),
	is_email_verified boolean default false
);

create table player_ids
(
    id        integer generated always as identity
        constraint player_ids_pkey
            primary key,
    player_id varchar(64) not null
        constraint player_ids_player_id_key
            unique
);

create table price_buy_updates
(
    id        integer generated always as identity
        constraint price_buy_updates_pkey
            primary key,
    player_id integer
        constraint price_buy_updates_player_id_fkey
            references player_ids,
    time      bigint  not null,
    price     integer not null
);

create table price_sell_updates
(
    id        integer generated always as identity
        constraint price_sell_updates_pkey
            primary key,
    player_id integer
        constraint price_sell_updates_player_id_fkey
            references player_ids,
    time      bigint  not null,
    price     integer not null
);
