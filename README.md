Radiobot
========

This is a telegram bot that uses ezstream to send mp3 files to your desired 
icecast server.

Songs are automatically added to playlist using youtube-dl

Bot commands include `/skipsong`, `/addsong`, `/flush`, `/startstream` and `/stop`

## Requeriments
- Ezstream
- Youtube-dl
- Icecast server credentials
- Telegram bot credentials
- Direnv

## Configuration
Create a `.envrc` file using `example.envrc` as guide

## Starting the service
Once configured, just start the service and head to your telegram bot

Initially it will not stream anything to icecast, you need to add songs first

## Adding songs
`/addsong url|search params`  
Using this command, you can add specific songs using url from youtube/youtube-music  
Or you can send a search query and the bot will try to get that song for you.

## Starting the stream
Once music is added, just sen `/startstream` to start the streaming. Songs will play in order 
And will repeat the whole playlist once it finishes playing.

## Stop streaming
Just send `/stop`. This will clear the entire playlist and stop the streaming. 
To resume, you need to add new songs and send `/startstream`

## Skip song
Send `/skipsong` to skip current song, if it is the last one, it will cicle to first one.

