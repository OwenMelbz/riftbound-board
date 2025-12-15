we need to build the functionality for the rune deck.

The main functions we need are:

- shuffle
- draw
- peek
- recycle
- exhaust

Shuffle is obvious, when we click this is randomises the order of the cards, you can shuffle the deck by either right clicking and clicking shuffle, or hovering over the deck and hitting S on the keyboard.

Draw is obvious, it takes the first item in the stack and places it into the rune zone, you can draw a card by either right clicking and clicking draw, or hovering over the deck and clicking D on the keyboard, or dragging the top card towards the rune zone.

Peek shows the top card in the bottom card drawer, you can peek by right clicking and clicking peek, or hovering over and clicking P on the keyboard.

Recycle is more complicated, you can only recycle cards which are in your rune zone, this basically puts the card back at the bottom of the pile (no shuffling) so it can be drawn later. You can recycle a card by right clicking on a played rune and clicking recycle, or hovering and pushing R, you can only recycle runes which are in the play zone.

You can exhaust a rune by hovering over it and pushing E on the keyboard, right clicking and clicking Exhaust, or double clicking on it, once its exhausted it should fade out to like 10% opacity to show its been used.

The rune area should be a flexible component, which reduces the size of the cards to fit the available space.
