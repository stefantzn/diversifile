require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { connectToDb, getDb } = require('./db');

const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 5001 || process.env.PORT;

let db;

console.log("Starting")

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send("Hello from the server");
});

app.post('/storeUserSurvey', (req, res) => {
    console.log("Running MATLAB script")
    console.log(req.body);
    res.send("Hello from the server 2");
});

app.get('/getSurveyData', (req, res) => {
    let surveyData = [];

    console.log("Getting survey data");
    db.collection('users')
        .find()
        .forEach(user => surveyData.push(user))
        .then(() => {
            res.status(200).json(surveyData);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ message: "Could not fetch survey data" })
        });
});

app.get('/getTicker', (req, res) => {
    console.log("Getting ticker");

    const company = "BCG";

    // const child = exec(`/Applications/MATLAB_R2024a.app/bin/matlab -nodisplay -nosplash -r "run('Candlestick_Analysis.m'); exit;"`, (error, stdout, stderr) => {
    const child = exec(`/Applications/MATLAB_R2024a.app/bin/matlab -nodisplay -nosplash -r "Candlestick_Analysis_Polygon('${company}'); exit;"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing MATLAB script: ${error.message}`);
          return; // Removed res.status(500).send('Error running MATLAB script') to focus on the child process handling
        }
        console.log(`MATLAB stdout: ${stdout}`);
        // console.error(`MATLAB stderr: ${stderr}`);
        // Assuming res.sendFile(outputImage) is part of a larger application logic not shown here
        res.sendFile(path.join(__dirname, 'plot.png'), (err) => {
            if (err) {
                console.log(err);
                res.status(500).send('Failed to send the image');
            } else {
                console.log('Image sent successfully');
            }
        });
        clearTimeout(killTimeout); 
    });
    
    // Set a timeout to kill the process if it runs longer than 5 seconds
    const killTimeout = setTimeout(() => {
        if (!child.killed) {
            console.log('MATLAB script did not finish in time. Killing the process.');
            child.kill(); // This sends SIGTERM signal
        }
    }, 15000); // Adjust
});



connectToDb((err) => {
    if (!err) {
        console.log("Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        db = getDb();
    }
});