const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const chromium = require('@sparticuz/chromium');
const {promisify} = require('util');
const writeFilePromise = promisify(fs.writeFile);

const username = process.env.TWITTER_USERNAME;                                       // Recommended to use env vars for username and password
const password = process.env.TWITTER_PASSWORD;

let loginUrl = 'https://twitter.com/login';
let homeUrl = 'https://twitter.com';
let browser = null;
let page = null;

puppeteer.use(StealthPlugin());                                                     // Stealth plugin to avoid detection

async function main(text, image, cookies) {
    try {
        console.log('[MAIN FUNCTION]')
        const options = {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            headless: chromium.headless,
            executablePath: await chromium.executablePath(),
            ignoreHTTPSErrors: true
        };
        browser = await puppeteer.launch(options);
        if((await browser.pages()).length > 0) {
            page = (await browser.pages())[0];
        } else {
            page = await browser.newPage();
        }

        await page.setUserAgent(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36"
        )
    
        await loadCookies(page, cookies);
        await page.goto(homeUrl, {waitUntil: 'networkidle2'});

        let isLoggedIn = await page.$('div[aria-label="Tweet text"]');
        if(!isLoggedIn) {
            await login(page);
        }
        await tweet(page, text, image);

        cookies = await saveCookies(page);
        await browser.close();
        return { cookies: cookies }
    } catch (err) {
        console.log('[MAIN FUNCTION ERROR]: ' + err);
        await page?.screenshot({
            path: 'screenshot.jpg'
          });
        throw err
    }
}


async function saveCookies(page) {
    try {
        const cookies = await page.cookies();
        const cookieJson = JSON.stringify(cookies, null, 2);
        await fs.writeFile('cookies.json', cookieJson, (err) => { if(err) console.log(err) });
        return cookieJson
    } catch (err) {
        console.log('[SAVE COOKIES FUNCTION ERROR]: ' + err);
    }
}


async function loadCookies(page, cookies) {
    try {
        if (!cookies) {
            const cookieJson = await fs.readFile('cookies.json', 'utf8', (err, data) => { if(err) console.log(err) });
            if(!cookieJson) return;
            cookies = JSON.parse(cookieJson);
        }
        await page.setCookie(...cookies);
    } catch (err) {
        console.log('[LOAD COOKIES FUNCTION ERROR]: ' + err);
    }
}

async function login(page) {
    try {
        console.log('[LOGIN FUNCTION]');
        await page.goto(loginUrl, {waitUntil: 'networkidle2'});

        await page.waitForSelector('input[autocomplete="username"]', {visible: true}, {timeout: 8000});
        await page.type('input[autocomplete="username"]',username,{delay: 400});
        await page.keyboard.press('Enter');
        await page.waitForSelector('input[autocomplete="current-password"]', {visible: true}, {timeout: 8000});
        await page.type('input[autocomplete="current-password"]',password,{delay: 300});
        await page.keyboard.press('Enter');
    } catch (err) {
        console.log('[LOGIN FUNCTION ERROR]: ' + err);
        throw err
    }
}

function downloadFile(url, outputPath) {
  return fetch(url)
      .then(x => x.arrayBuffer())
      .then(x => writeFilePromise(outputPath, Buffer.from(x)));
}

async function tweet(page, text, imageUrl) {
    try{
        console.log('[TWEET FUNCTION]');
        await page.waitForSelector('div[aria-label="Tweet text"]', {visible: true}, {timeout: 10000});
        await page.click('div[aria-label="Tweet text"]', {delay: 200});
        await page.keyboard.type(text, {delay: 270});                                             // type your tweet
        await page.waitForTimeout(500);

        if (imageUrl) {
            await downloadFile(imageUrl,'/tmp/image.png');        // download image from url
            const elementHandle = await page.$("input[type=file]");
            await elementHandle.uploadFile('/tmp/image.png'); 
        
            await page.waitForTimeout(2000);
            await page.keyboard.down('ControlLeft');
            await page.keyboard.press('Enter');
            await page.keyboard.up('ControlLeft');
        }

        await page.click('div[data-testid="tweetButtonInline"]', {delay: 200});
        // await page.waitForSelector('div[data-testid="tweetButtonInline"][aria-disabled="disabled"]', {visible: true}, {timeout: 10000});
        
        // when sent, the tweet button will be disabled     
        // await page.waitForSelector('//button[contains(., "Tweet")][aria-disabled="true"]', {visible: true}, {timeout: 10000})                      // click tweet button

        await page.waitForTimeout(10000);                                                 // wait for 10 seconds before closing the browser (if your internet is slow or tweet media is large you can increase this time to avoid errors)
    } catch (err) {
        console.log('[TWEET FUNCTION ERROR]: ' + err);
        throw err
    }
}

module.exports = main