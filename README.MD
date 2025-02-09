# addbook

Similar to the [script that I created](https://github.com/bobmonsour/mkbo) for creating a new post on my personal website, I created this script for creating a new book in the books.json file that drives the [Books page](https://bobmonsour.com/books/) on the site.

Generally, the script prompts for the title of the book, the author, the date that the book was read, and the rating that I gave to the book. It then creates a new entry in the books.json file with the information provided.

However, as I noted in my presentation to the Eleventy Meetup, there are some idiosychracies to the data, i.e., special cases to handle. For example, if I am currently reading the book, I need a way to indicate that to the script, in which case "currently" becomes the value for the yearRead element of the entry and the rating value is set to "". The script handles this for me. Another example is the use of a localCover image. I can choose that to be true or false, and if false, it is not included in the entry.

I've also set up the script to, upon execution, ask if I want it to operate on a books.json file in the local directory (for testing) or in the very specific directory where my "real" books.json file is located.

And, just as I created a symlink to the script for the "kbo" script, I've set it up so that I can run it from any directory. For example, the directory /usr/bin/local is in my path, so I create a symlink to the script in that directory.

On macOS, creating a symlink to the script in /usr/local/bin is done with the following command:

```bash
ln -s /path/to/script /usr/local/bin/addbook
```

Feel free to adapt this for your own purposes.
