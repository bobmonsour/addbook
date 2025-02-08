#!/usr/bin/env node

import fs from "fs";
import inquirer from "inquirer";
import { format } from "date-fns";

const today = format(new Date(), "yyyy-MM-dd");

async function promptUser() {
	const answers = await inquirer.prompt([
		{
			type: "input",
			name: "title",
			message: "Title:",
		},
		{
			type: "input",
			name: "author",
			message: "Author:",
		},
		{
			type: "input",
			name: "isbn",
			message: "ISBN (13 characters):",
			validate: (input) => {
				const isValid = /^\d{13}$/.test(input);
				return isValid || "ISBN must be a 13-character string of numbers.";
			},
		},
		{
			type: "input",
			name: "rating",
			message: "Rating (1-5 or leave blank):",
			validate: (input) => {
				if (input === "") return true;
				const rating = Number(input);
				return (
					(rating >= 1 && rating <= 5) ||
					"Rating must be a number between 1 and 5."
				);
			},
		},
		{
			type: "input",
			name: "yearRead",
			message: "Year Read (yyyy-mm-dd):",
			default: today,
			validate: (input) => {
				const isValid = /^\d{4}-\d{2}-\d{2}$/.test(input);
				return isValid || "Date must be in the format yyyy-mm-dd.";
			},
		},
		{
			type: "confirm",
			name: "localCover",
			message: "Local cover image? (y/n):",
			default: false,
		},
	]);

	return answers;
}

function generateJsonContent(answers) {
	const jsonContent = {
		title: answers.title,
		author: answers.author,
		isbn: answers.isbn,
		rating: answers.rating || "",
		yearRead: answers.yearRead,
	};

	if (answers.localCover) {
		jsonContent.localCover = true;
	}

	return jsonContent;
}

async function confirmOrEditJson(jsonContent, answers) {
	let accept = false;

	while (!accept) {
		console.log("Generated JSON content:");
		console.log(JSON.stringify(jsonContent, null, 2));

		const response = await inquirer.prompt([
			{
				type: "confirm",
				name: "accept",
				message: "Do you accept the generated JSON content?",
				default: true,
			},
		]);

		accept = response.accept;

		if (!accept) {
			answers = await promptUser();
			jsonContent = generateJsonContent(answers);
		}
	}

	return answers;
}

async function main() {
	let answers = await promptUser();
	let jsonContent = generateJsonContent(answers);

	answers = await confirmOrEditJson(jsonContent, answers);
	jsonContent = generateJsonContent(answers);

	const filePath = "./books.json";
	let booksArray = [];

	if (fs.existsSync(filePath)) {
		const fileContent = fs.readFileSync(filePath, "utf8");
		booksArray = JSON.parse(fileContent);
	}

	booksArray.push(jsonContent);
	fs.writeFileSync(filePath, JSON.stringify(booksArray, null, 2), "utf8");
	console.log(`Book added to ${filePath} successfully!`);
}

main();
