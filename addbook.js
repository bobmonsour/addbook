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
			validate: (input) => input.trim() !== "" || "Title is required.",
		},
		{
			type: "input",
			name: "author",
			message: "Author:",
			validate: (input) => input.trim() !== "" || "Author is required.",
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
			type: "list",
			name: "yearRead",
			message: "Year Read:",
			choices: [
				{ name: `1) today's date (${today})`, value: "1" },
				{ name: "2) 'currently reading'", value: "2" },
				{ name: "3) 'undated'", value: "3" },
				{ name: "4) custom as yyyy-mm-dd", value: "4" },
			],
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
				message: "Enter the date (yyyy-mm-dd):",
				validate: (input) => {
					const isValid = /^\d{4}-\d{2}-\d{2}$/.test(input);
					return isValid || "Date must be in the format yyyy-mm-dd.";
				},
			},
		]);
		answers.yearRead = customDateAnswer.customDate;
	}

	if (answers.yearRead !== "currently") {
		const ratingMessage =
			answers.yearRead === "undated"
				? "Rating (1-5):"
				: "Rating (1-5 or leave blank):";
		const ratingAnswer = await inquirer.prompt([
			{
				type: "input",
				name: "rating",
				message: ratingMessage,
				validate: (input) => {
					if (input === "" && answers.yearRead !== "undated") return true;
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
			type: "confirm",
			name: "localCover",
			message: "Local cover image? (y/n):",
			default: false,
		},
	]);
	answers.localCover = localCoverAnswer.localCover;

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
