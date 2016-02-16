Name That Song
==============
An automated version of a drinking game that my friends and I play.  The rules are fairly simple:
   * One person, called the moderator, chooses an artist for the game.
   * Create a playlist based on the artist - manually, we would use Spotify radio.
   * A song is randomly chosen from the playlist and played for a length of time decided on by the moderator.
   * The players get to "buzz in" by hitting the table. Once a player has buzzed in, he or she must answer.
   * The first player to buzz in answers first and is given a length of time decided on by the moderator to give the song name and artist of the song that has just been played.
   * The player must match the song name and artist *exactly* with a few exceptions:
     * If a song name has a parenthetical, e.g. *You Spin Me Right Round ( Like a Record )*, a player may exclude the parenthetical portion of the title without penalty.
     * If a song has several artists, e.g. *Walk This Way* by Aerosmith ( feat. Run DMC ), a player may exclude or include any featured artists, so long as he or she names the first artist.
   * If the player correctly names the song or artist before the moderator calls time, he or she is awarded 1 point.
   * If the player incorrectly names the song or artist, or the moderator calls time, he or she loses 1 point.
     * Players may have a negative score.
   * Players continue guessing in the order that they buzzed in until someone is awarded a point or no one else has buzzed in.
   * The game continues in this manner until someone reaches five points, with the additional condition that the winner must be two points ahead of the player in second place.
     * If a player reaches 5 points without being ahead of the second place player, play continues until 1 player has more than 5 points and is 2 points ahead of the player in second place.
     
In order to automate this process, some rules are modified: 
   * The moderator may play. His or her only role is to pick an artist used to generate a playlist.
   * A song is played by looking it up using the Spotify API.  The preview track returned is used, so a song will only be played for the duration of the preview track - typically 30 seconds.
   * Players must guess while the song is playing.  After a song has ended, guessing stops.
   * Buzzing in is not required, so buzz order is not respected.  Any player guessing correctly in the allowed time slot will be awarded a point and any player guessing incorrectly will lose a point.  Players may abstain from guessing and neither lose nor gain points.
   
Installing
----------
1. Install [NodeJS](https://nodejs.org/)
2. Install global dependencies from NPM by running the following commands in a terminal
  
   ```
   npm install -g babel
   ```
  
   ```
   npm install -g browserify
   ```
  
   ```
   npm install -g bunyan
   ```
  
   ```
   npm install -g gulp
   ```
  
3. Navigate to the project root and run

   ```
   npm install
   ```
   
   to install project dependencies
   
4. Obtain an Echo Nest API key and place it in the privateProperties.js file
   * [Register for an Echo Nest account](https://developer.echonest.com/account/register)
   * After you have registered and activated your account, [log in to the Echo Nest website](https://developer.echonest.com/account/login) and obtain your API key
   * Create a file in &lt;project_root&gt;/app/config named privateProperties.js with the following contents:
   
    ```
    module.exports = {
        echonestApiKey: '<your_api_key>'
    };
    ```

5. [Download](https://www.mongodb.org/downloads#production) and [install](https://docs.mongodb.org/manual/tutorial/) MongoDB
   * Create a database to store the data for this application.
   * Remember that privateProperties.js files from step 4?  It's time to add a new property to it
   
   ```
   mongoUrl: 'mongodb://<url_of_mongo_server>/<database_name>'
   ```
   * Make sure mongod is running when you start the application! Otherwise, you're going to be seeing database errors everywhere.
   
6. Add properties for sending emails
   * This app includes functionality to send an email to a user with a new password if the user forgets his/her password. You will need to add credentials to an email account that you own for this to work.
   * *Note about Gmail accounts*: If you would like to send emails from a Gmail account, you'll need to [allow the account to be accessed by less secure apps](https://www.google.com/settings/security/lesssecureapps). 
   
   * Add the following properties to the privateProperties.js file:
   
   ```
   emailService: <email_service_to_use>,
   emailUsername: <username_of_email_account_to_use>,
   emailPassword: <password_to_email_account>
   ```
   
Building/Running Web App
------------------------
Navigate to &lt;project_root&gt;/webapp and use a terminal to run

    gulp

This will run the default gulp task, which builds the web app and moves the built files into the &lt;project_root&gt;/webapp/public folder.
Once this process is complete, deploy the webapp/public folder to your favorite http server.  An easy to use, lightweight http server is [http-server](https://www.npmjs.com/package/http-server).
It can be installed by using the following command in a terminal

    npm install -g http-server

Afterwards, navigate to the &lt;project_root&gt;/webapp folder and use a terminal to run

    http-server

http-server will automatically deploy index.html from the public folder to http://localhost:8080
   
Running Server App
------------------
In order for the webapp to work, the server side component needs to be running
To start the server app, navigate to &lt;project_root&gt;/app and use a terminal to run

    node index.js

To prettify logging statements in the terminal, you can pipe the output through the bunyan CLI installed in step 2 of the installation instructions like so:

    node index.js | bunyan

The server app will deploy to localhost on the port specified by the port property of app/config/appProperties.js ( this is defaulted to port 8008 )

Known Issues
------------
* Source maps are not generating correctly