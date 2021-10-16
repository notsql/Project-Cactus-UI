import { createApp } from 'petite-vue';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set } from "firebase/database";
import './style.css';

let isDark = window.localStorage.getItem('cache/dark_mode') ?? false;
isDark = isDark === 'true';



// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBubqivZTf_r0CgESFxU58NvCk_KszgwJA",
    authDomain: "project-cactus-c9549.firebaseapp.com",
    databaseURL: "https://project-cactus-c9549-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "project-cactus-c9549",
    storageBucket: "project-cactus-c9549.appspot.com",
    messagingSenderId: "909637966251",
    appId: "1:909637966251:web:a4473a1a6ce92b2513daee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
function db(link) {return ref(getDatabase(app), link)}


const states = {
    loading: false,
    loadingText: "",
    darkMode: isDark,
    newsHeadline: null,
    newsConfidence: null,
    issueReported: false,
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function() {
        navigator.serviceWorker
            .register("/serviceWorker.js")
            .then(res => console.log("service worker registered"))
            .catch(err => console.log("service worker not registered", err))
    });
}

createApp({
    ...states,
    _toggleDarkMode() {
        this.darkMode = !this.darkMode;
        window.localStorage.setItem('cache/dark_mode', this.darkMode);
    },
    _shareLink() {
        navigator.share({
            url: window.location,
            title: 'Project Cactus',
            text: 'This is a beautiful title and this news is X% correct'
        });
    },
    _checkNews() {
        const init = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sentences: [this._newsHeadline]
            })
        }

        this.loading = true;
        this.loadingText = "Verifying News";

        fetch(new Request('https://heroku-cactus.herokuapp.com/predict'), init)
            .then(result => result.json()).then(body => {
                this.loading = false;
                this.newsConfidence = (body[0][0] * 100).toFixed(2);
            }).catch(error => rej(error));
    },
    _reportIssue() {
        this.loading = true;
        this.loadingText = "Reporting Issue";

        const reportId = push(db('reports')).key;

        set(db(`reports/${reportId}`), {
            headline: this.newsHeadline,
            probability: this.newsConfidence
        }).then(() => {
            this.loading = false;
            this.issueReported = true;
        });
    },
    get _newsHeadline() {
        const urlSearchParams = new URLSearchParams(window.location.search);
        const params = Object.fromEntries(urlSearchParams.entries());
        return params['news'];
    },
    get _darkText() {
        return this.darkMode ? 'Light Mode' : 'Dark Mode';
    },
    get _searchedNews() {
        return this._newsHeadline != null;
    },
    mounted() {
        if (this._searchedNews) {
            this.newsHeadline = this._newsHeadline;
            this._checkNews();

            document.getElementById('filled-box').addEventListener('keydown', (event) => {
                if (event.key == 'Enter' && this.newsHeadline != null) {
                    window.location.href = `?news=${this.newsHeadline}`;
                }
            });
        } else {
            document.getElementById('empty-search').addEventListener('keydown', (event) => {
                if (event.key == 'Enter' && this.newsHeadline != null) {
                    window.location.href = `?news=${this.newsHeadline}`;
                }
            });
        }
    }
}).mount();