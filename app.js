class MovieRatingPredictor {
    constructor() {
        this.model = null;
        this.trainingData = null;
        this.testData = null;
        this.featureEncoder = {};
        this.isDataProcessed = false;
        this.isModelTrained = false;
        this.trainingHistory = [];
    }

    async loadAndProcessData() {
        try {
            this.updateStatus('Loading movie data...');
            
            // Use the provided CSV data
            const csvData = this.getMovieData();
            const parsedData = Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            });

            const movies = parsedData.data.filter(movie => 
                movie.imdb_rating && movie.imdb_rating > 0
            );

            this.updateStatus(`Processing ${movies.length} movies...`);
            this.displayDatasetStats(movies);

            // Prepare features and labels
            const { features, labels } = this.preprocessData(movies);
            
            // Split data
            const splitIndex = Math.floor(features.length * 0.8);
            this.trainingData = {
                features: features.slice(0, splitIndex),
                labels: labels.slice(0, splitIndex)
            };
            this.testData = {
                features: features.slice(splitIndex),
                labels: labels.slice(splitIndex)
            };

            this.isDataProcessed = true;
            document.getElementById('trainBtn').disabled = false;
            this.updateStatus('Data processed successfully! Ready for training.');
            
        } catch (error) {
            this.updateStatus('Error processing data: ' + error.message);
        }
    }

    getMovieData() {
        return `movie_id,title,content_type,genre_primary,genre_secondary,release_year,duration_minutes,rating,language,country_of_origin,imdb_rating,production_budget,box_office_revenue,number_of_seasons,number_of_episodes,is_netflix_original,added_to_platform,content_warning
movie_0001,Dragon Legend,Stand-up Comedy,History,Thriller,2014,35.0,TV-Y,French,Japan,,,,,,False,2023-08-07,False
movie_0002,Storm Warrior,Stand-up Comedy,Sci-Fi,,2017,37.0,PG,Japanese,USA,3.3,,,,,False,2022-01-28,True
movie_0003,Fire Family,Movie,Drama,,2003,142.0,TV-MA,English,USA,8.5,2114120.0,,,,False,2021-05-04,True
movie_0004,Our Princess,Documentary,Sci-Fi,,2011,131.0,NC-17,Japanese,USA,5.3,,,,,False,2022-11-26,False
movie_0005,Warrior Mission,Documentary,Sport,Mystery,2015,91.0,TV-G,English,USA,3.1,,,,,False,2023-06-15,False
movie_0006,Kingdom Phoenix,Movie,Documentary,Music,1997,113.0,PG-13,English,USA,8.0,4214426.0,792291.0,,,False,2021-01-21,False
movie_0007,Battle Story,TV Series,Sci-Fi,,2003,52.0,TV-Y7,English,USA,,,,,158.0,False,2021-11-30,False
movie_0008,Old House,Movie,Horror,,1991,109.0,TV-Y,Spanish,South Korea,7.7,629216.0,3995303.0,,,False,2020-10-04,False
movie_0009,Dragon Empire,Movie,Biography,,2013,123.0,PG,Spanish,USA,8.4,,,,,False,2024-05-09,False
movie_0010,Dream War,Limited Series,Thriller,Animation,2019,49.0,TV-Y,Italian,Japan,8.2,,,12.0,32.0,False,2021-09-20,False
movie_0011,Day Dream,Movie,Western,,2022,148.0,R,English,USA,,16018207.0,,,,True,2025-06-02,False
movie_0012,Bright War,Movie,Crime,Sci-Fi,1997,95.0,G,English,South Korea,9.9,,72997481.0,,,False,2025-05-22,False
movie_0013,Dream Journey,Movie,Romance,,2013,138.0,PG,English,Germany,8.6,1758821.0,3573506.0,,,False,2021-01-20,True
movie_0014,Little War,Movie,Mystery,,1990,117.0,TV-14,Korean,Japan,8.4,,32793336.0,,,True,2020-10-01,False
movie_0015,Hero Empire,Movie,Sci-Fi,Mystery,2012,108.0,TV-G,English,UK,,2006408.0,,,,False,2022-09-18,False
movie_0016,Last Dream,TV Series,Family,,1999,54.0,PG-13,Spanish,USA,6.0,,,,139.0,False,2022-01-19,False
movie_0017,Kingdom Battle,Stand-up Comedy,War,,2018,72.0,NC-17,Italian,UK,5.9,,,,,True,2021-10-13,False
movie_0018,Princess Phoenix,Movie,Adventure,,2011,116.0,PG,English,France,7.6,10555440.0,7278095.0,,,True,2021-04-04,False
movie_0019,An Legend,Limited Series,Sci-Fi,Crime,2004,48.0,TV-PG,English,UK,9.3,,,1.0,155.0,False,2022-05-12,False
movie_0020,An Mystery,TV Series,Fantasy,,2009,41.0,PG-13,English,Canada,7.1,,,14.0,168.0,False,2022-08-21,False
movie_0021,Family Love,Limited Series,Family,Thriller,2020,52.0,TV-PG,English,USA,8.5,,,5.0,106.0,False,2023-07-25,False
movie_0022,First Mystery,Movie,Sci-Fi,,1998,115.0,TV-PG,English,South Korea,,2934549.0,40080746.0,,,True,2022-09-12,False
movie_0023,Mystery Night,TV Series,Adventure,,2020,60.0,TV-MA,English,USA,4.8,,,6.0,197.0,True,2024-10-18,False
movie_0024,Fire Mystery,Movie,Biography,,1990,114.0,TV-Y7,English,South Korea,4.4,895311.0,52104449.0,,,False,2023-04-04,False
movie_0025,Quest Queen,Movie,Family,,2013,127.0,PG,English,UK,9.2,,1286089.0,,,False,2024-12-21,False
movie_0026,Last Love,TV Series,Comedy,,2000,78.0,PG,English,India,8.6,,,10.0,121.0,False,2025-02-23,False
movie_0027,House House,Stand-up Comedy,Western,,2012,60.0,PG-13,English,South Korea,7.0,,,,,True,2021-09-19,False
movie_0028,Legend Hero,Stand-up Comedy,Biography,Romance,2003,417.0,PG,French,USA,,,,,,False,2024-01-07,False
movie_0029,Dark Princess,Movie,Horror,Sport,1998,117.0,PG,English,Japan,5.4,,6128075.0,,,False,2022-04-16,False
movie_0030,Dragon King,Movie,Documentary,,2017,151.0,G,English,India,7.5,,9373734.0,,,False,2024-06-10,True
movie_0031,Warrior War,Movie,Romance,,2024,129.0,TV-Y7,English,USA,4.7,,2057069.0,,,False,2022-06-10,False
movie_0032,House Hero,TV Series,Crime,,2000,31.0,TV-Y7,German,UK,,,,3.0,24.0,False,2024-02-13,False
movie_0033,Mystery City,Movie,Horror,,1995,116.0,TV-MA,Korean,USA,7.3,,,,,False,2022-06-24,False
movie_0034,Mission Kingdom,TV Series,War,Horror,2018,48.0,TV-PG,English,India,7.7,,,14.0,138.0,True,2023-10-22,True
movie_0035,Princess Love,TV Series,Family,Romance,1994,38.0,TV-PG,English,USA,7.4,,,,62.0,False,2021-03-01,False
movie_0036,House Legend,TV Series,Adventure,Action,2018,61.0,PG-13,Spanish,Germany,6.5,,,10.0,57.0,False,2025-04-18,False
movie_0037,Empire King,TV Series,Comedy,,2011,51.0,TV-G,French,USA,,,,5.0,23.0,False,2025-05-02,False
movie_0038,A Empire,Movie,Action,,1993,98.0,TV-MA,Korean,USA,5.6,3127772.0,391629433.0,,,True,2021-06-29,False
movie_0039,Love Queen,Movie,Mystery,,2019,80.0,PG-13,German,USA,7.3,5603605.0,,,,False,2022-01-10,False
movie_0040,Mystery Quest,Movie,War,Music,2005,116.0,PG-13,Japanese,UK,6.4,1816487.0,2016406.0,,,False,2023-02-04,False
movie_0041,Kingdom War,Documentary,Biography,Sport,2003,83.0,TV-14,English,USA,,,,,,False,2023-03-23,False
movie_0042,First Hero,Movie,Action,,2020,452.0,TV-G,Hindi,India,6.7,2146992.0,55547817.0,,,True,2024-06-01,False
movie_0043,City Queen,Documentary,Family,,2005,80.0,PG-13,Spanish,USA,6.3,,,,,False,2022-12-12,False
movie_0044,Dragon City,Stand-up Comedy,War,Documentary,1998,379.0,TV-G,English,USA,5.2,,,,,False,2023-01-31,False
movie_0045,Battle Day,Documentary,History,,2003,92.0,PG,English,USA,5.4,,,,,True,2025-02-18,False
movie_0046,The Dragon,TV Series,Family,,2002,43.0,PG-13,English,USA,6.7,,,8.0,113.0,False,2023-08-15,False
movie_0047,Day Journey,TV Series,Thriller,,2008,47.0,PG,English,Japan,5.4,,,9.0,54.0,False,2020-12-15,False
movie_0048,Secret Legend,Movie,Family,,1994,102.0,TV-14,Hindi,UK,,93953191.0,835652471.0,,,False,2024-08-30,False
movie_0049,Kingdom Day,Movie,Thriller,,2023,111.0,NC-17,English,Germany,4.6,629194.0,2736647.0,,,False,2024-03-03,False
movie_0050,Last Quest,TV Series,Biography,,2015,41.0,TV-PG,French,USA,6.1,,,8.0,116.0,False,2023-08-10,False
movie_0051,Hero Mystery,TV Series,Western,Comedy,1995,52.0,TV-PG,English,USA,8.0,,,12.0,178.0,False,2023-09-10,False
movie_0052,Hero Journey,Movie,Sport,Biography,2002,104.0,PG-13,Italian,USA,4.9,6117844.0,16638609.0,,,True,2022-11-01,False
movie_0053,Princess City,Documentary,History,,2018,90.0,TV-Y7,English,Canada,4.7,,,,,False,2022-02-28,False
movie_0054,Phoenix Journey,TV Series,Romance,History,2021,35.0,TV-MA,English,France,8.8,,,,78.0,False,2024-11-17,False
movie_0055,Queen Quest,Movie,Sci-Fi,,2002,84.0,G,Italian,India,4.7,6494786.0,,,,True,2023-11-21,True
movie_0056,Big Princess,Movie,Adventure,Comedy,1997,137.0,TV-Y,English,USA,6.2,3593765.0,2259750.0,,,True,2021-01-18,False
movie_0057,Mission Dream,Movie,Biography,,2017,82.0,TV-14,Spanish,USA,5.9,4186498.0,7674756.0,,,True,2021-10-30,False
movie_0058,Day Mystery,Stand-up Comedy,Drama,,2020,57.0,R,English,USA,6.6,,,,,True,2022-10-16,False
movie_0059,Night Secret,TV Series,Romance,Sci-Fi,1992,580.0,TV-14,French,USA,6.3,,,4.0,42.0,True,2020-08-24,False
movie_0060,Night Warrior,TV Series,Biography,,1993,44.0,PG-13,English,USA,4.9,,,10.0,46.0,False,2024-08-08,False
movie_0061,Journey Night,Movie,Drama,,2017,100.0,TV-MA,English,UK,6.9,11264097.0,,,,False,2021-11-25,False
movie_0062,Phoenix Mission,Movie,Action,,2012,129.0,TV-Y,English,USA,4.4,4494260.0,53848956.0,,,False,2022-08-16,False
movie_0063,Hero Kingdom,Movie,Adventure,,1997,165.0,G,Hindi,UK,6.9,1360448.0,656952.0,,,False,2021-04-22,False
movie_0064,Last City,Documentary,Animation,Crime,1994,115.0,TV-PG,Japanese,South Korea,5.8,,,,,False,2021-07-03,False
movie_0065,Day Queen,Movie,Sport,,1991,109.0,TV-14,Italian,USA,,11397312.0,32147534.0,,,True,2024-11-16,False
movie_0066,Adventure King,Movie,Comedy,Romance,2013,104.0,TV-14,English,Canada,7.9,4687811.0,26772080.0,,,False,2022-06-24,False
movie_0067,Story Mystery,TV Series,Crime,,2005,50.0,PG,English,USA,6.8,,,2.0,73.0,False,2023-05-21,False
movie_0068,Secret Night,TV Series,Horror,,1994,46.0,R,English,USA,7.5,,,5.0,44.0,False,2021-10-22,False
movie_0069,An Quest,TV Series,Documentary,,2020,42.0,NC-17,Spanish,South Korea,8.1,,,9.0,6.0,False,2024-02-13,False
movie_0070,Battle City,Documentary,Biography,,2023,81.0,R,Hindi,France,6.5,,,,,False,2022-12-31,True
movie_0071,Phoenix Ice,TV Series,Music,Sci-Fi,2016,70.0,TV-MA,English,Canada,6.7,,,3.0,79.0,True,2024-06-17,False
movie_0072,Storm Warrior,Limited Series,Sci-Fi,Drama,2015,73.0,TV-14,French,South Korea,,,,14.0,75.0,False,2021-06-09,False
movie_0073,House Family,TV Series,Action,,2021,42.0,TV-PG,German,Canada,4.8,,,5.0,121.0,True,2023-03-24,False
movie_0074,Dark Ice,Movie,Comedy,,2005,150.0,PG,English,Canada,,1915176.0,3628760.0,,,True,2021-11-07,False
movie_0075,War Hero,TV Series,Animation,Crime,2016,18.0,TV-PG,English,USA,6.5,,,1.0,177.0,False,2023-04-21,True
movie_0076,Empire Battle,Movie,Family,Documentary,2023,108.0,G,English,USA,6.8,20837483.0,4643156.0,,,True,2023-05-30,False
movie_0077,Our Battle,TV Series,War,History,2018,26.0,TV-14,English,USA,6.4,,,5.0,95.0,True,2024-12-03,False
movie_0078,Little War,Movie,Fantasy,Mystery,1999,143.0,NC-17,Hindi,USA,,1035450.0,,,,False,2022-03-30,False
movie_0079,Mission Dream,Movie,War,,2005,414.0,TV-G,Hindi,USA,5.9,4204348.0,24367896.0,,,False,2021-02-07,False
movie_0080,Day Queen,Movie,Documentary,Documentary,2014,89.0,TV-Y,English,USA,7.8,5453306.0,32981493.0,,,False,2022-12-26,False
movie_0081,Mission Fire,Movie,Documentary,,2023,119.0,TV-14,Italian,Japan,7.8,22471820.0,5603722.0,,,False,2021-06-05,False
movie_0082,Bright Phoenix,Movie,Western,,1995,408.0,TV-MA,German,South Korea,4.6,8461755.0,173407724.0,,,True,2021-04-14,False
movie_0083,Journey Phoenix,Movie,Sci-Fi,,2024,101.0,TV-Y,English,USA,7.0,97100.0,69320180.0,,,True,2020-08-14,True
movie_0084,Night Phoenix,Movie,Documentary,Crime,1998,114.0,PG,English,Germany,6.8,,39250966.0,,,True,2023-09-08,True
movie_0085,Mission Secret,Stand-up Comedy,Crime,Crime,2009,44.0,TV-Y,Korean,USA,5.7,,,,,False,2024-05-03,True
movie_0086,Big Adventure,Documentary,Biography,Family,1998,68.0,G,English,UK,0.6,,,,,True,2024-07-11,False
movie_0087,Our Storm,Movie,Comedy,,2010,38.0,PG-13,Italian,USA,6.6,,,,,False,2021-02-22,True
movie_0088,Journey Love,TV Series,Sport,,1990,63.0,PG-13,English,Canada,7.2,,,4.0,79.0,False,2023-03-02,False
movie_0089,Mystery Day,Movie,Romance,,2014,79.0,TV-Y7,Hindi,Japan,0.9,44425136.0,16348642.0,,,True,2021-06-07,True
movie_0090,Ice Kingdom,Documentary,Animation,Biography,2003,107.0,TV-PG,English,USA,8.7,,,,,False,2021-12-24,True
movie_0091,Dragon Ice,Documentary,Horror,,1993,79.0,PG-13,English,Japan,4.7,,,,,True,2022-11-24,False
movie_0092,Story Kingdom,TV Series,War,,1991,35.0,PG,English,UK,8.8,,,14.0,62.0,False,2024-04-23,False
movie_0093,City Queen,Movie,History,Biography,2020,101.0,R,English,USA,9.7,,41795066.0,,,True,2024-03-31,False
movie_0094,Dark City,Stand-up Comedy,Western,Western,1993,68.0,TV-Y7,English,USA,5.3,,,,,False,2021-08-03,False
movie_0095,Legend Storm,TV Series,Fantasy,,2003,32.0,TV-MA,English,USA,3.6,,,9.0,76.0,True,2025-05-06,False
movie_0096,King Fire,Movie,Action,,2018,105.0,G,English,UK,4.5,8939550.0,4931077.0,,,False,2024-06-22,True
movie_0097,Secret War,Movie,Fantasy,,2001,102.0,TV-Y,Hindi,Canada,3.1,2137471.0,36710118.0,,,False,2021-05-15,False
movie_0098,A War,Stand-up Comedy,Adventure,,2001,77.0,PG-13,English,USA,6.4,,,,,True,2022-07-27,False
movie_0099,Dragon Day,Documentary,Western,,2021,110.0,PG,English,UK,8.3,,,,,False,2021-07-06,True
movie_0100,Adventure Dream,Movie,Fantasy,,1996,99.0,TV-G,English,Canada,6.0,8590064.0,,,,False,2024-07-30,False`;
    }

    preprocessData(movies) {
        // Extract and encode features
        const features = [];
        const labels = [];
        
        // Define feature categories
        const contentTypes = ['Movie', 'TV Series', 'Documentary', 'Stand-up Comedy', 'Limited Series'];
        const primaryGenres = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Thriller', 'Romance', 'Adventure', 'Biography', 'Crime', 'Family', 'Fantasy', 'History', 'Music', 'Mystery', 'Sport', 'War', 'Western'];
        const languages = ['English', 'Spanish', 'French', 'Japanese', 'Korean', 'Italian', 'German', 'Hindi'];
        const countries = ['USA', 'UK', 'Canada', 'Japan', 'South Korea', 'Germany', 'France', 'India'];
        const ratings = ['PG', 'PG-13', 'R', 'TV-MA', 'TV-14', 'TV-Y', 'TV-Y7', 'TV-PG', 'G', 'NC-17'];

        movies.forEach(movie => {
            const featureVector = [];
            
            // Numerical features (normalized)
            const duration = movie.duration_minutes || 90;
            const year = movie.release_year || 2000;
            const budget = movie.production_budget ? Math.log10(movie.production_budget + 1) / 10 : 0;
            
            featureVector.push(
                duration / 200, // Normalize duration (max ~200 min)
                (year - 1990) / 30, // Normalize year (1990-2020)
                budget
            );
            
            // Categorical features (one-hot encoded)
            this.oneHotEncode(featureVector, movie.content_type, contentTypes);
            this.oneHotEncode(featureVector, movie.genre_primary, primaryGenres);
            this.oneHotEncode(featureVector, movie.language, languages);
            this.oneHotEncode(featureVector, movie.country_of_origin, countries);
            this.oneHotEncode(featureVector, movie.rating, ratings);
            
            // Boolean features
            featureVector.push(movie.is_netflix_original === 'True' ? 1 : 0);
            featureVector.push(movie.content_warning === 'True' ? 1 : 0);
            
            features.push(featureVector);
            labels.push(movie.imdb_rating / 10); // Normalize rating to 0-1
        });

        return { features, labels };
    }

    oneHotEncode(featureVector, value, categories) {
        const index = categories.indexOf(value);
        for (let i = 0; i < categories.length; i++) {
            featureVector.push(i === index ? 1 : 0);
        }
    }

    createModel() {
        const model = tf.sequential();
        
        // Input layer
        model.add(tf.layers.dense({
            units: 128,
            activation: 'relu',
            inputShape: [68] // Total feature size
        }));
        
        // Hidden layers
        model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
        
        // Output layer (regression)
        model.add(tf.layers.dense({ units: 1, activation: 'linear' }));
        
        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError',
            metrics: ['mse']
        });
        
        return model;
    }

    async trainModel() {
        if (!this.isDataProcessed) {
            this.updateStatus('Please process data first!');
            return;
        }

        try {
            this.updateStatus('Starting model training...');
            document.getElementById('trainBtn').disabled = true;

            // Convert data to tensors
            const xs = tf.tensor2d(this.trainingData.features);
            const ys = tf.tensor2d(this.trainingData.labels, [this.trainingData.labels.length, 1]);

            // Create model
            this.model = this.createModel();
            
            // Train model
            const history = await this.model.fit(xs, ys, {
                epochs: 100,
                batchSize: 32,
                validationSplit: 0.2,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        this.trainingHistory.push(logs);
                        this.updateTrainingProgress(epoch, logs);
                        this.updateTrainingChart();
                    }
                }
            });

            this.isModelTrained = true;
            document.getElementById('predictBtn').disabled = false;
            this.updateStatus('Model training completed!');
            
            // Evaluate model
            this.evaluateModel();
            
            // Clean up tensors
            xs.dispose();
            ys.dispose();

        } catch (error) {
            this.updateStatus('Training error: ' + error.message);
        }
    }

    evaluateModel() {
        const testXs = tf.tensor2d(this.testData.features);
        const testYs = tf.tensor2d(this.testData.labels, [this.testData.labels.length, 1]);
        
        const predictions = this.model.predict(testXs);
        const loss = tf.metrics.meanSquaredError(testYs, predictions).dataSync()[0];
        
        const statsDiv = document.getElementById('trainingStats');
        statsDiv.innerHTML = `
            <h3>Model Evaluation</h3>
            <p>Test Loss (MSE): ${loss.toFixed(4)}</p>
            <p>Test RMSE: ${Math.sqrt(loss).toFixed(4)}</p>
            <p>Sample Size: ${this.testData.features.length} movies</p>
        `;
        
        testXs.dispose();
        testYs.dispose();
        predictions.dispose();
    }

    async predictRating() {
        if (!this.isModelTrained) {
            this.updateStatus('Please train the model first!');
            return;
        }

        try {
            // Get form values
            const features = this.encodePredictionFeatures();
            const inputTensor = tf.tensor2d([features]);
            
            const prediction = this.model.predict(inputTensor);
            const predictedRating = (await prediction.data())[0] * 10; // Denormalize
            
            const resultDiv = document.getElementById('predictionResult');
            resultDiv.innerHTML = `
                <h3>Prediction Result</h3>
                <p>Predicted IMDB Rating: <strong>${predictedRating.toFixed(1)}/10</strong></p>
                <p>Confidence: ${(Math.max(0, 1 - Math.abs(predictedRating - 7) / 10) * 100).toFixed(1)}%</p>
            `;
            
            inputTensor.dispose();
            prediction.dispose();
            
        } catch (error) {
            this.updateStatus('Prediction error: ' + error.message);
        }
    }

    encodePredictionFeatures() {
        const features = [];
        
        // Numerical features
        const duration = parseFloat(document.getElementById('duration').value) / 200;
        const year = (parseInt(document.getElementById('releaseYear').value) - 1990) / 30;
        const budget = Math.log10(parseFloat(document.getElementById('budget').value) + 1) / 10;
        
        features.push(duration, year, budget);
        
        // Categorical features
        const contentTypes = ['Movie', 'TV Series', 'Documentary', 'Stand-up Comedy', 'Limited Series'];
        const primaryGenres = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Thriller', 'Romance', 'Adventure', 'Biography', 'Crime', 'Family', 'Fantasy', 'History', 'Music', 'Mystery', 'Sport', 'War', 'Western'];
        const languages = ['English', 'Spanish', 'French', 'Japanese', 'Korean', 'Italian', 'German', 'Hindi'];
        const countries = ['USA', 'UK', 'Canada', 'Japan', 'South Korea', 'Germany', 'France', 'India'];
        const ratings = ['PG', 'PG-13', 'R', 'TV-MA', 'TV-14', 'TV-Y', 'TV-Y7', 'TV-PG', 'G', 'NC-17'];
        
        this.oneHotEncode(features, document.getElementById('contentType').value, contentTypes);
        this.oneHotEncode(features, document.getElementById('primaryGenre').value, primaryGenres);
        this.oneHotEncode(features, document.getElementById('language').value, languages);
        this.oneHotEncode(features, document.getElementById('country').value, countries);
        this.oneHotEncode(features, document.getElementById('rating').value, ratings);
        
        // Boolean features
        features.push(document.getElementById('isNetflixOriginal').value === 'true' ? 1 : 0);
        features.push(0); // content_warning (default false)
        
        return features;
    }

    displayDatasetStats(movies) {
        const stats = {
            total: movies.length,
            avgRating: movies.reduce((sum, m) => sum + m.imdb_rating, 0) / movies.length,
            minRating: Math.min(...movies.map(m => m.imdb_rating)),
            maxRating: Math.max(...movies.map(m => m.imdb_rating)),
            netflixOriginals: movies.filter(m => m.is_netflix_original === 'True').length
        };

        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <h3>Total Movies</h3>
                <p>${stats.total}</p>
            </div>
            <div class="stat-card">
                <h3>Avg Rating</h3>
                <p>${stats.avgRating.toFixed(1)}/10</p>
            </div>
            <div class="stat-card">
                <h3>Rating Range</h3>
                <p>${stats.minRating}-${stats.maxRating}</p>
            </div>
            <div class="stat-card">
                <h3>Netflix Originals</h3>
                <p>${stats.netflixOriginals}</p>
            </div>
        `;

        // Create rating distribution chart
        this.createDistributionChart(movies);
    }

    createDistributionChart(movies) {
        const ratings = movies.map(m => m.imdb_rating);
        const ctx = document.getElementById('distributionChart').getContext('2d');
        
        new Chart(ctx, {
            type: 'histogram',
            data: {
                datasets: [{
                    label: 'IMDB Rating Distribution',
                    data: ratings,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        title: { display: true, text: 'IMDB Rating' },
                        min: 0,
                        max: 10
                    },
                    y: {
                        title: { display: true, text: 'Frequency' },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateTrainingProgress(epoch, logs) {
        const progress = (epoch / 100) * 100;
        document.getElementById('trainingProgress').style.width = progress + '%';
        
        const status = `Epoch ${epoch + 1}/100 - Loss: ${logs.loss.toFixed(4)}`;
        this.updateStatus(status);
    }

    updateTrainingChart() {
        const ctx = document.getElementById('trainingChart').getContext('2d');
        
        if (this.trainingChart) {
            this.trainingChart.destroy();
        }
        
        this.trainingChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.trainingHistory.map((_, i) => i + 1),
                datasets: [{
                    label: 'Training Loss',
                    data: this.trainingHistory.map(log => log.loss),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
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
        // You could also display this in a status div in the UI
    }
}

// Initialize application
const app = new MovieRatingPredictor();