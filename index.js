/*
The Script for the viral Video of Gerald Reimertz
Do not use without giving credits: https://www.youtube.com/c/geraldreimertz

Inspired by GeekLaunch: https://www.youtube.com/watch?v=jtDJg2euQhk
Watch his explanation on how to get the ClientId + Secret + RefreshToken the easy way ;)
 */

const {google} = require('googleapis');
const fs = require('fs');
const { promisify } = require('util');
const puppeteer = require('puppeteer')

const writeFileAsync = promisify(fs.writeFile)

async function main () {
    const authClient = new google.auth.OAuth2({
        clientId: 'YOUR_OWN_CLIENT_ID', //Change to yours. Read the Instruction above!
        clientSecret: 'YOUR_OWN_CLIENT_SECRET', //Change to yours
    });

    authClient.setCredentials({
        refresh_token: 'YOUR_OWN_REFRESH_TOKEN' //Change to yours
    });

    const videoId = 'YOUR_OWN_VIDEO_ID'; //Set the video ID you want to edit, you can copy it from the Video URL

    const youtube = google.youtube({
        auth: authClient,
        version: 'v3'
    })

    const videoResult = await youtube.videos.list({
        id: videoId,
        part: 'snippet,statistics'
    });

    const {statistics, snippet} = videoResult.data.items[0];

    const viewCount = numberWithDots(Number(statistics.viewCount));

    if(getDays()){
        if(Number(statistics.viewCount) > 1000000) {

            let newTitle = 'Gir hier deinen gewünschten Titel ein';
            await youtube.thumbnails.set({
                videoId: videoId,
                media: {
                    mimeType: 'image/png',
                    body: fs.readFileSync('success.png'),
                }
            });
            snippet.title = newTitle;
            await youtube.videos.update({
                part: 'snippet',
                requestBody: {
                    id: videoId,
                    snippet
                }
            });
        } else {
            await generateImage(getDays(),viewCount);
            await youtube.thumbnails.set({
                videoId: videoId,
                media: {
                    mimeType: 'image/png',
                    body: fs.readFileSync('thumbnail.png'),
                }
            });
        }

    } else {
        let newTitle = 'Gir hier deinen gewünschten Titel ein';

        if(Number(statistics.viewCount) > 1000000) {
            await youtube.thumbnails.set({
                videoId: videoId,
                media: {
                    mimeType: 'image/png',
                    body: fs.readFileSync('success.png'),
                }
            });

        } else {
            newTitle = 'Gir hier deinen gewünschten Titel ein';
            await youtube.thumbnails.set({
                videoId: videoId,
                media: {
                    mimeType: 'image/png',
                    body: fs.readFileSync('failed.png'),
                }
            });
        }

        snippet.title = newTitle;
        await youtube.videos.update({
            part: 'snippet',
            requestBody: {
                id: videoId,
                snippet
            }
        });
    }
}

/**
 * Calls via Puppeteer a web Page that generates the Thumbnail, receives it as BASE64 PNG and writes it to a file
 * Make sure to install Chromium on your system, to make Puppeteer work
 * @param days
 * @param count
 * @returns {Promise<void>}
 */

async function generateImage(days, count) {
    browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/chromium-browser', //Link the correct Path here
        ignoreDefaultArgs: ["--enable-automation"]
    })

    const page = await browser.newPage();

    //My Own Thumbnail generator. Source Code is in git as well thumbnail-generator.html
    //I just leave it here as a working example for you
    await page.goto('https://www.evanoapp.com/youtube/thumbnail-generator.html?days='+days+'&count='+count, {
        waitUntil: 'load',
        timeout: 30000
    })

    await page.waitForSelector('#resultimg');

    const thumbnails = await page.$$eval('#resultimg[src]', imgs => imgs.map(img => img.getAttribute('src')));
    const thumbnail = thumbnails[0];

    const base64Data = thumbnail.replace(/^data:image\/png;base64,/, "");

    await writeFileAsync("thumbnail.png",base64Data, 'base64');

    browser.close();
}

/**
 * Formats a given Number with Dots e.g. 14.232.313
 * @param x
 * @returns {string}
 */
function numberWithDots(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Get a DE-String of the difference in Days to next New Year
 * @returns {string|null}
 */
function getDays(){
    var now = new Date();
    var then = new Date("01/01/2023 00:00:00");
    var difference = then - now;
    var days = Math.ceil(difference / (1000 * 60 * 60 * 24));
    if(days > 1){
        return days+' TAGEN';
    } else if (days === 1) {
        return 'EINEM TAG';
    } else {
        return null;
    }
}

main();

