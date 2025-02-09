#!/usr/bin/env node

import fs from "fs";
import inquirer from "inquirer";
import { format } from "date-fns";

const today = format(new Date(), "yyyy/MM/dd");

async function promptUser(defaults = {}) {
	const answers = await inquirer.prompt([
		{
			type: "input",
			name: "title",
			message: "Title:",
			default: defaults.title || "",
			validate: (input) => input.trim() !== "" || "Title is required.",
		},
		{
			type: "input",
			name: "author",
			message: "Author:",
			default: defaults.author || "",
			validate: (input) => input.trim() !== "" || "Author is required.",
		},
		{
			type: "input",
			name: "ISBN",
			message: "ISBN (13 characters):",
			default: defaults.ISBN || "",
			validate: (input) => {
				const isValid = /^\d{13}$/.test(input);
				return isValid || "ISBN must be a 13-character string of numbers.";
			},
		},
		{
			type: "list",
			name: "yearRead",
			message: "Year Read:",
			choices: [
				{ name: `1) today's date (${today})`, value: "1" },
				{ name: "2) 'currently reading'", value: "2" },
				{ name: "3) 'undated'", value: "3" },
				{ name: "4) custom as yyyy/mm/dd", value: "4" },
			],
			default: defaults.yearRead || "1",
		},
	]);

	if (answers.yearRead === "1") {
		answers.yearRead = today;
	} else if (answers.yearRead === "2") {
		answers.yearRead = "currently";
		answers.rating = "";
	} else if (answers.yearRead === "3") {
		answers.yearRead = "undated";
	} else if (answers.yearRead === "4") {
		const customDateAnswer = await inquirer.prompt([
			{
				type: "input",
				name: "customDate",
				message: "Enter the date (yyyy/mm/dd):",
				default: defaults.yearRead || "",
				validate: (input) => {
					const isValid = /^\d{4}\/\d{2}\/\d{2}$/.test(input);
					// const isValid = /^\d{4}-\d{2}-\d{2}$/.test(input);
					return isValid || "Date must be in the format yyyy/mm/dd.";
				},
			},
		]);
		answers.yearRead = customDateAnswer.customDate;
	}

	if (answers.yearRead !== "currently") {
		const ratingMessage = "Rating (1-5):";
		const ratingAnswer = await inquirer.prompt([
			{
				type: "input",
				name: "rating",
				message: ratingMessage,
				default: defaults.rating || "",
				validate: (input) => {
					const rating = Number(input);
					return (
						(rating >= 1 && rating <= 5) ||
						"Rating must be a number between 1 and 5."
					);
				},
			},
		]);
		answers.rating = ratingAnswer.rating;
	}

	const localCoverAnswer = await inquirer.prompt([
		{
			type: "input",
			name: "localCover",
			message: "Local cover image? (y/n):",
			default: defaults.localCover ? "y" : "n",
			validate: (input) => {
				const isValid =
					input.toLowerCase() === "y" || input.toLowerCase() === "n";
				return isValid || "Please enter 'y' or 'n'.";
			},
			filter: (input) => input.toLowerCase() === "y",
		},
	]);
	answers.localCover = localCoverAnswer.localCover;

	return answers;
}

function generateJsonContent(answers) {
	const jsonContent = {
		title: answers.title,
		author: answers.author,
		ISBN: answers.ISBN,
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
				type: "input",
				name: "accept",
				message: "Accept the book data? (y/n):",
				default: "y",
				validate: (input) => {
					const isValid =
						input.toLowerCase() === "y" || input.toLowerCase() === "n";
					return isValid || "Please enter 'y' or 'n'.";
				},
				filter: (input) => input.toLowerCase() === "y",
			},
		]);

		accept = response.accept;

		if (!accept) {
			answers = await promptUser(answers);
			jsonContent = generateJsonContent(answers);
		}
	}

	return answers;
}

async function main() {
	const fileChoice = await inquirer.prompt([
		{
			type: "list",
			name: "filePath",
			message: "Which books.json file should be used?",
			choices: [
				{ name: "books.json in the current directory", value: "./books.json" },
				{
					name: "Real data in the bobmonsour.com directory",
					value:
						"/Users/Bob/Dropbox/Docs/Sites/bobmonsour.com/src/_data/books.json",
				},
			],
		},
	]);

	const filePath = fileChoice.filePath;

	if (filePath === "./books.json" && !fs.existsSync(filePath)) {
		fs.writeFileSync(filePath, "[]", "utf8");
		console.log(`Created ${filePath} as an empty JSON array.`);
	}

	let answers = await promptUser();
	let jsonContent = generateJsonContent(answers);

	answers = await confirmOrEditJson(jsonContent, answers);
	jsonContent = generateJsonContent(answers);

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
