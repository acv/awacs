# awacs

A Next War Series (GMT Games) Air Combat Assistant

Just open index.html in a web browser, no server needed. No framework. I just
needed an exercise to bring my JavaScript skills (from circa 2002) to something
remotely modern. I guess jQuery is 2009 tech but still, give me a break ;-).

# Usage

The blue (or red) square in the top left is the active player, clicking it
switches back and forth, this will flip the Air Superiority track (no effect
when contested, of course.)

Next is the air superiority track, click on the box that matches the track on
your game map (or in vassal...) This will affect the selected column when
resolving Standard game ADF. In advanced ADF Detection, this will be used to
decide which ADF values to use, normal or local.

Below that is a modal bar, only Standard ADF and Advanced Detection are
currently handled. Standard ADF is straightforward.

Advanced detection will first walk you through the flowchart (from the back of
the NWIP GSRs) to choose the correct ADF track to use (Normal, Local, Naval, etc.)
and then you will be prompted to enter the ADF value (click on the boxes...) and
add all the relevant DRMs. Finally, the dice bot will solve the detection roll
for you. No tables, no fuss, no more forgetting 25.1 #3b or some other esoteric
clause.

# Why I really did this

These are some complex air combat rules, I think I now understand them.

# LICENSE

Consider this under the MIT license or the 3 clause BSD license, whichever you
feel like.

Copyright (C) Alexandre Carmel-Veilleux, 2016.

The game and therefore the tables encoded in this software are copyright of
GMT Games, LLC and the hard work of Mitchell Land, Gene Billingsley and the other
fine folks at GMT. Please buy their games. Next War: Poland looks like it will
be great.
