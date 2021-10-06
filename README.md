# Survey of the Month

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

## Logic
### #key#
 - Denotes a new string that sould be inserted randomly from an array of strings
 - Keys incluce
    - #animal# -> dog
    - #character# -> batman
    - #*# -> `a random key` -> ???
### #key.mod#
 - Modifiers are added after keys and will perform further changes to the inserted string
    - #person.capitalize# -> alice -> Alice
 - You can string multiple modifiers together and they will be performed in order
    - #object.a.s# -> oven -> an ovens
 - Available mods
    - `capitalize` - Make the first letter uppercase
    - `a` - Add 'a' or 'an' before a word
    - `ed` - Add 'ed' to the end of a word
    - `s` -  Add 's'/'es'/'ies' to the end of a word
    - `possessive` - Add 's to a word
    - `range` - Converts the a key in the format #start_end_step_pad.range# into a number
        - #1_10.range# -> 5
        - #20_500_20.range# -> 140
        - #1_10_1_2.range# -> 05
    - `html_i` - Italics
    - `html_b` - Bold
    - `html_em` - Emphasize
    - `html_s` - Strikethrough
    - `html_sub` - Subscript
    - `html_sup` - Superscript
    - `html_u` - Underline

### Temporary Values
 - Keys can also be handled without inserting them into text and using them later
 - A string starting with [keyName:#value#] will be can later be accessed by #keyName#
 - This is useful for using the same value multiple times or saving a separate value for context
 - Values will be calculated on key parsing, you can also save static values
    - [key:#color#] or [key:blue]
 - Values stored this way are global, once they are stored can be accessed from anywhere in the grammar.
    - ```
        "origin": ["You're off to fight #fighter# but can't find your #fighter_weapon#!],
        "fighter": ["[fighter_weapon:sword]Dragon", "[fighter_weapon:slingshot]Goliath"]
        ```
    - Origin is parsed, then fighter, then fighter_weapon is saved, then fighter_weapon is parsed
### Inline Choices
 - Sometimes you only have a small number of options and don't want to create a whole new key and string array. That's where inline choices come in.
 - Formatted as `^$optionA:optionB$`. Examples:
    - `"Last ^$show:movie$ you watched?"` -> "Last show you watched?" OR "Last movie you watched"
    - `"Could you fight ^$#animal.a#:#character#$?"` -> "Could you figh a duck" OR "Could you fight Dwight K. Schrute"
    - `Hello^$:, How are you$?` -> "Hello?" OR "Hello, How are you?"
    - `^$I have \\$100:I'm broke$` -> "I have $100" OR "I'm broke"
    - `^$Testing\\:1:Done$` -> "Testin:1" OR "Done"
 - Choices are applied before everything else.
    - `[type:mulit][key:^$character:animal:singer$]Choose your protector.` becomes `[type:multi][key:animal]Choose your protector.` before we start to parse temporary values

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
Run `gulp` for building server and client 
