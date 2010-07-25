Draggies is a demo application built on node.js, faye bayeux server and jQuery UI.

# Application

Draggies is a real-time collaborative web application involving draggable boxes with letters, sort of like a child's alphabet blocks.  Draggies uses the [faye bayeux server](http://github.com/jcoglan/faye) to broadcast all user-made changes to all other users in real time.  Application state is recorded and new clients are brought up-to-date.

# Known Issues

- Rendering issues in Opera
- Text input is limited to A-Z and 0-9

# Usage

First you'll need [node.js](http://nodejs.org/) installed.  The current version of this application uses node.js [version 0.1.29](http://github.com/ry/node/tree/v0.1.29).

To checkout Draggies and its dependencies:

    git clone git://github.com/jtwb/Draggies.git
    git submodule init
    git submodule update

To run Draggies:

    cd Draggies/
    sudo node draggieserver.js

Application will be served on `/index.html`

