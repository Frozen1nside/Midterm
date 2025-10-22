class MovieRatingApp {
    constructor() {
        this.dataLoader = new DataLoader();
        this.model = new GRUModel();
        this.trainingData = null;
        this.testData = null;
        this.isDataLoaded = false;
        this.isModelTrained = false;
        this.trainingChart = null;
        this.distributionChart = null;
        
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        window.app = this;
        this.model.onEpochEnd = this.updateTrainingProgress.bind(this);
    }

    async loadAndProcessData() {
        try {
            this.updateStatus('Loading movie data...');
            
            this.dataLoader.loadMovieData();
            const processed = this.dataLoader.preprocessData();
            
            const splitIndex = Math.floor(processed.features.length * 0.8);
            this.trainingData = {
                features: processed.features.slice(0, splitIndex),
                labels: processed.labels.slice(0, splitIndex)
            };
            this.testData = {
                features: processed.features.slice(splitIndex),
                labels: processed.labels.slice(splitIndex)
            };

            this.isDataLoaded = true;
            
            this.displayDatasetStats();
            document.getElementById('trainBtn').disabled = false;
            this.updateStatus('Data loaded successfully! Ready for training.');
            
        } catch (error) {
            this.updateStatus('Error loading data: ' + error.message);
        }
    }

    async trainModel() {
        if (!this.isDataLoaded) {
            this.updateStatus('Please load data first!');
            return;
        }

        try {
            this.updateStatus('Starting model training...');
            document.getElementById('trainBtn').disabled = true;
            document.getElementById('trainingProgress').style.width = '0%';

            await this.model.trainModel(
                this.trainingData.features, 
                this.trainingData.labels,
                50
            );

            this.isModelTrained = true;
            document.getElementById('predictBtn').disabled = false;
            
            const evaluation = this.model.evaluateModel(
                this.testData.features, 
                this.testData.labels
            );
            
            this.updateStatus(`Training completed! Test RMSE: ${evaluation.rmse.toFixed(2)}`);
            this.updateTrainingChart();
            
        } catch (error) {
            this.updateStatus('Training error: ' + error.message);
        }
    }

    async predictRating() {
        if (!this.isModelTrained) {
            this.updateStatus('Please train the model first!');
            return;
        }

        try {
            const features = this.getPredictionFeatures();
            const predictedRating = await this.model.predict(features);
            
            const resultDiv = document.getElementById('predictionResult');
            resultDiv.innerHTML = `
                <h3>🎬 Prediction Result</h3>
                <p><strong>Predicted IMDB Rating: ${predictedRating.toFixed(1)}/10</strong></p>
                <p>Confidence: ${this.calculateConfidence(predictedRating).toFixed(1)}%</p>
            `;
            
        } catch (error) {
            this.updateStatus('Prediction error: ' + error.message);
        }
    }

    getPredictionFeatures() {
        const contentTypes = ['Movie', 'TV Series', 'Documentary', 'Stand-up Comedy', 'Limited Series'];
        const primaryGenres = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Thriller', 'Romance', 'Adventure', 'Biography', 'Crime', 'Family', 'Fantasy', 'History', 'Music', 'Mystery', 'Sport', 'War', 'Western'];
        const languages = ['English', 'Spanish', 'French', 'Japanese', 'Korean', 'Italian', 'German', 'Hindi'];
        const countries = ['USA', 'UK', 'Canada', 'Japan', 'South Korea', 'Germany', 'France', 'India'];
        const ratings = ['PG', 'PG-13', 'R', 'TV-MA', 'TV-14', 'TV-Y', 'TV-Y7', 'TV-PG', 'G', 'NC-17'];

        const features = [];
        
        const duration = parseFloat(document.getElementById('duration').value) / 200;
        const year = (parseInt(document.getElementById('releaseYear').value) - 1990) / 30;
        const budget = Math.log10(parseFloat(document.getElementById('budget').value) + 1) / 10;
        
        features.push(duration, year, budget);
        
        this.oneHotEncode(features, document.getElementById('contentType').value, contentTypes);
        this.oneHotEncode(features, document.getElementById('primaryGenre').value, primaryGenres);
        this.oneHotEncode(features, document.getElementById('language').value, languages);
        this.oneHotEncode(features, document.getElementById('country').value, countries);
        this.oneHotEncode(features, document.getElementById('rating').value, ratings);
        
        features.push(document.getElementById('isNetflixOriginal').value === 'true' ? 1 : 0);
        features.push(0);
        
        return features;
    }

    oneHotEncode(featureVector, value, categories) {
        const index = categories.indexOf(value);
        for (let i = 0; i < categories.length; i++) {
            featureVector.push(i === index ? 1 : 0);
        }
    }

    calculateConfidence(predictedRating) {
        return Math.max(0, 100 - Math.abs(predictedRating - 7) * 10);
    }

    displayDatasetStats() {
        const stats = this.dataLoader.getDatasetStats();
        
        document.getElementById('totalMovies').textContent = stats.total;
        document.getElementById('withRatings').textContent = stats.withRatings;
        document.getElementById('avgRating').textContent = stats.avgRating.toFixed(1) + '/10';
        document.getElementById('ratingRange').textContent = stats.minRating + '-' + stats.maxRating;

        this.createDistributionChart();
    }

    createDistributionChart() {
        const ctx = document.getElementById('distributionChart').getContext('2d');
        const ratings = this.dataLoader.movies.map(m => m.imdb_rating).filter(r => r && !isNaN(r));
        
        if (this.distributionChart) {
            this.distributionChart.destroy();
        }
        
        this.distributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['0-2', '2-4', '4-6', '6-8', '8-10'],
                datasets: [{
                    label: 'Number of Movies',
                    data: [
                        ratings.filter(r => r >= 0 && r < 2).length,
                        ratings.filter(r => r >= 2 && r < 4).length,
                        ratings.filter(r => r >= 4 && r < 6).length,
                        ratings.filter(r => r >= 6 && r < 8).length,
                        ratings.filter(r => r >= 8 && r <= 10).length
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Movies' }
                    },
                    x: {
                        title: { display: true, text: 'IMDB Rating Range' }
                    }
                }
            }
        });
    }

    updateTrainingProgress(epoch, logs) {
        const progress = ((epoch + 1) / 50) * 100;
        document.getElementById('trainingProgress').style.width = progress + '%';
        
        const status = `Epoch ${epoch + 1}/50 - Loss: ${logs.loss.toFixed(4)}`;
        this.updateStatus(status);
    }

    updateTrainingChart() {
        const ctx = document.getElementById('trainingChart').getContext('2d');
        const history = this.model.getTrainingHistory();
        
        if (this.trainingChart) {
            this.trainingChart.destroy();
        }
        
        this.trainingChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: history.map((_, i) => i + 1),
                datasets: [{
                    label: 'Training Loss',
                    data: history.map(log => log.loss),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Loss' }
                    },
                    x: {
                        title: { display: true, text: 'Epoch' }
                    }
                }
            }
        });
    }

    updateStatus(message) {
        console.log(message);
        document.getElementById('status').textContent = message;
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MovieRatingApp();
});