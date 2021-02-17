-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema library
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `library` ;

-- -----------------------------------------------------
-- Schema library
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `library` DEFAULT CHARACTER SET utf8mb4 ;
USE `library` ;

-- -----------------------------------------------------
-- Table `library`.`users`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `library`.`users` ;

CREATE TABLE IF NOT EXISTS `library`.`users` (
  `user_id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(16) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `refresh_token` VARCHAR(255) NULL,
  `create_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `role` TINYINT NOT NULL,
  `profile_image_url` VARCHAR(255) NULL,
  PRIMARY KEY (`user_id`));


-- -----------------------------------------------------
-- Table `library`.`authors`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `library`.`authors` ;

CREATE TABLE IF NOT EXISTS `library`.`authors` (
  `author_id` BIGINT NOT NULL AUTO_INCREMENT,
  `author_name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`author_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `library`.`books`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `library`.`books` ;

CREATE TABLE IF NOT EXISTS `library`.`books` (
  `book_id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `author_id` BIGINT NOT NULL,
  PRIMARY KEY (`book_id`),
  INDEX `author_id_fk_idx` (`author_id` ASC),
  CONSTRAINT `author_id_fk`
    FOREIGN KEY (`author_id`)
    REFERENCES `library`.`authors` (`author_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `library`.`book_loans`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `library`.`book_loans` ;

CREATE TABLE IF NOT EXISTS `library`.`book_loans` (
  `request_id` BIGINT NOT NULL AUTO_INCREMENT,
  `book_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 0,
  `request_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `start_date` TIMESTAMP NULL,
  `end_date` TIMESTAMP NULL,
  PRIMARY KEY (`request_id`),
  INDEX `book_id_fk_idx` (`book_id` ASC),
  INDEX `user_id_fk_idx` (`user_id` ASC),
  CONSTRAINT `book_id_fk`
    FOREIGN KEY (`book_id`)
    REFERENCES `library`.`books` (`book_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `user_id_fk`
    FOREIGN KEY (`user_id`)
    REFERENCES `library`.`users` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
