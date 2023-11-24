create table Registered_user (
    id integer primary key auto_increment,
    username varchar(255),
    path_to_avatar varchar(255),
    pwd_hash text,
    visibility integer,
    is_admin integer
);

create table `Group` (
    id integer primary key auto_increment,
    name varchar(255),
    description text,
    path_to_avatar varchar(255),
    visibility int
);

create table Comment (
    id integer primary key auto_increment,
    thread_id integer,
    author_id integer,
    content text,
    post_time datetime,
    edited integer
);

create table Thread (
    id integer primary key auto_increment,
    group_id integer,
    title varchar(255),
    content_id integer
);

create table User_Comment_vote(
    id integer primary key auto_increment,
    user_id integer,
    comment_id integer,
    score integer
);

create table User_Group_role (
    id integer primary key auto_increment,
    user_id integer,
    group_id integer,
    role integer
);

create table Notification (
    id integer primary key auto_increment,
    applicant_id integer,
    recipient_id integer,
    group_id integer,
    notification_type integer,
    message varchar(255),
    post_time datetime
);


alter table Comment add constraint fk_comment_author foreign key (author_id) references Registered_user(id) on delete cascade;
alter table Thread add constraint fk_thread_content foreign key (content_id) references Comment(id) on delete cascade;
alter table Thread add constraint fk_thread_group foreign key (group_id) references `Group`(id) on delete cascade;
alter table User_Comment_vote add constraint fk_vote_comment foreign key (comment_id) references Comment(id) on delete cascade;
alter table User_Comment_vote add constraint fk_vote_user foreign key (user_id) references Registered_user(id) on delete cascade;
alter table User_Group_role add constraint fk_role_user foreign key (user_id) references  Registered_user(id) on delete cascade;
alter table User_Group_role add constraint fk_role_group foreign key (group_id) references `Group`(id) on delete cascade;
alter table Comment add constraint fk_comment_thread foreign key (thread_id) references Thread(id) on delete cascade;
alter table Notification add constraint fk_notification_applicant foreign key (applicant_id) references Registered_user(id) on delete cascade;
alter table Notification add constraint fk_notification_recipient foreign key (recipient_id) references Registered_user(id) on delete cascade;
alter table Notification add constraint fk_notification_group foreign key (group_id) references `Group`(id) on delete cascade;


DELIMITER $$

CREATE PROCEDURE DropTablesAndConstraints()
BEGIN
    -- Remove foreign key constraints
    ALTER TABLE Comment DROP FOREIGN KEY fk_comment_author;
    ALTER TABLE Thread DROP FOREIGN KEY fk_thread_content;
    ALTER TABLE Thread DROP FOREIGN KEY fk_thread_group;
    ALTER TABLE User_Comment_vote DROP FOREIGN KEY fk_vote_comment;
    ALTER TABLE User_Comment_vote DROP FOREIGN KEY fk_vote_user;
    ALTER TABLE User_Group_role DROP FOREIGN KEY fk_role_user;
    ALTER TABLE User_Group_role DROP FOREIGN KEY fk_role_group;
    ALTER TABLE Comment DROP FOREIGN KEY fk_comment_thread;
    ALTER TABLE Notification DROP FOREIGN KEY fk_notification_applicant;
    ALTER TABLE Notification DROP FOREIGN KEY fk_notification_recipient;
    ALTER TABLE Notification DROP FOREIGN KEY fk_notification_group;

    -- Dropping tables
    DROP TABLE IF EXISTS User_Group_role;
    DROP TABLE IF EXISTS User_Comment_vote;
    DROP TABLE IF EXISTS Thread;
    DROP TABLE IF EXISTS Comment;
    DROP TABLE IF EXISTS `Group`;
    DROP TABLE IF EXISTS Registered_user;
    DROP TABLE IF EXISTS Notification;
END$$

DELIMITER ;
