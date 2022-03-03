# Survey of the Month

Survey Of The Month is a website built around the idea of pseudorandom question generator. Expanding on that, users can also create full surveys, share them with their friends, or take a survey. And then view everyone's answers in a presentation.

## Disclaimer
This is a fun side project, any feature updates or bug fixes are not guaranteed.

## Try It Out

[Survey of the Month](https://survey.polklabs.com/home)

## Tracery

This app is build around a scratch build version of [Tracery](http://www.tracery.io/), with some custom modifications.

The basic idea is you load a dictionary with each entry having an array of strings. You start with some origin key then take a random string from that list and look for any more keys denoted by `This is a #key#`.

```
{
    "origin": [ "#intro_question#", "#question#", "#close_question#" ],

    "intro_question": [
        "[type:text]How are you doing this fine day of #monthNow#?",
        "[type:multi][key:generalAnswers]Are you excited to take this survey?"
    ]
}
```

### Duplicate Prevention
 - In order to stop the same values appearing multiple times in the same result we check to see if we've already seen the given value.
 - This way if you call the same #key# multiple times you should not get duplicated until you've seen all the options.
  - `#color# with #color# and #color#` -> "blue with red and green"
    - Should never become "blue with blue and red"

### Order Of Operations
 - Inline choices are always parsed first, allowing you to choose between multiple keys before parsing them
 - Variables are next, variable values are parsed during this time too.
    - Ex: [animal1:#animal#] -> "animal1":"duck"
 - Lastly all remaining keys are parsed
---

## WIP

### Probabilities
 - Given the following grammar:
    - ```
        "origin": ["#sky.a# sky!"],
        "sky": ["#color#, "stormy"],
        "color": ["red", "blue", "orange", "white"]
        ```
    - The phrase "a stormy sky!" has a 50% chance to appear, while "a blue sky!" has only 12.5% chance
    - For simple grammar this isn't too much of an issue but once you get into cases were one option has 3 possibilities and another has 300 it can start to feel repetitive given you'll see the 3 possibility option 50% of the time.
- Solution:
    - Before selecting a random option get a list of all possible options 1 level deep. Then if an option has a `#key#` or `^$choiceA:choiceB$`, give it a higher weighting in the random chance.
    - The more keys/choices an option has, the higher it's weighted

---

## Running

### Local Dev
Run `npm run dev`

### Building Server.js
Run `webpack`

Run `node server.bundle.js`

### Building/Packaging App
Run `npm install -g gulp`

Run `gulp` for building server and client 

### Git
`git update-index --assume-unchanged FILE.EXT`