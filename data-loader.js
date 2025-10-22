class DataLoader {
    constructor() {
        this.movies = [];
        this.features = [];
        this.labels = [];
        this.featureNames = [];
        this.isProcessed = false;
    }

    loadMovieData() {
        try {
            const csvData = this.getMovieCSVData();
            const parsedData = Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            });

            this.movies = parsedData.data.filter(movie => 
                movie.imdb_rating && movie.imdb_rating > 0 && !isNaN(movie.imdb_rating)
            );

            console.log(`Loaded ${this.movies.length} movies with IMDB ratings`);
            return this.movies;
        } catch (error) {
            console.error('Error loading movie data:', error);
            throw error;
        }
    }

    preprocessData() {
        if (this.movies.length === 0) {
            throw new Error('No movies loaded. Call loadMovieData() first.');
        }

        this.features = [];
        this.labels = [];
        this.featureNames = [];

        const contentTypes = ['Movie', 'TV Series', 'Documentary', 'Stand-up Comedy', 'Limited Series'];
        const primaryGenres = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Thriller', 'Romance', 'Adventure', 'Biography', 'Crime', 'Family', 'Fantasy', 'History', 'Music', 'Mystery', 'Sport', 'War', 'Western'];
        const languages = ['English', 'Spanish', 'French', 'Japanese', 'Korean', 'Italian', 'German', 'Hindi'];
        const countries = ['USA', 'UK', 'Canada', 'Japan', 'South Korea', 'Germany', 'France', 'India'];
        const ratings = ['PG', 'PG-13', 'R', 'TV-MA', 'TV-14', 'TV-Y', 'TV-Y7', 'TV-PG', 'G', 'NC-17'];

        this.featureNames.push('duration_norm', 'year_norm', 'budget_norm');
        
        contentTypes.forEach(type => this.featureNames.push(`content_${type}`));
        primaryGenres.forEach(genre => this.featureNames.push(`genre_${genre}`));
        languages.forEach(lang => this.featureNames.push(`lang_${lang}`));
        countries.forEach(country => this.featureNames.push(`country_${country}`));
        ratings.forEach(rating => this.featureNames.push(`rating_${rating}`));
        
        this.featureNames.push('is_netflix_original', 'has_content_warning');

        this.movies.forEach(movie => {
            const featureVector = [];
            
            const duration = movie.duration_minutes || 90;
            const year = movie.release_year || 2000;
            const budget = movie.production_budget ? Math.log10(movie.production_budget + 1) / 10 : 0;
            
            featureVector.push(
                Math.min(duration / 200, 1),
                Math.min((year - 1990) / 30, 1),
                Math.min(budget, 1)
            );
            
            this.oneHotEncode(featureVector, movie.content_type, contentTypes);
            this.oneHotEncode(featureVector, movie.genre_primary, primaryGenres);
            this.oneHotEncode(featureVector, movie.language, languages);
            this.oneHotEncode(featureVector, movie.country_of_origin, countries);
            this.oneHotEncode(featureVector, movie.rating, ratings);
            
            featureVector.push(movie.is_netflix_original === 'True' ? 1 : 0);
            featureVector.push(movie.content_warning === 'True' ? 1 : 0);
            
            this.features.push(featureVector);
            this.labels.push(Math.min(movie.imdb_rating / 10, 1));
        });

        this.isProcessed = true;
        console.log(`Processed ${this.features.length} samples with ${this.features[0].length} features each`);
        
        return {
            features: this.features,
            labels: this.labels,
            featureNames: this.featureNames
        };
    }

    oneHotEncode(featureVector, value, categories) {
        const index = categories.indexOf(value);
        for (let i = 0; i < categories.length; i++) {
            featureVector.push(i === index ? 1 : 0);
        }
    }

    getMovieCSVData() {
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
movie_0050,Last Quest,TV Series,Biography,,2015,41.0,TV-PG,French,USA,6.1,,,8.0,116.0,False,2023-08-10,False`;
    }

    getDatasetStats() {
        const ratings = this.movies.map(m => m.imdb_rating).filter(r => r && !isNaN(r));
        return {
            total: this.movies.length,
            withRatings: ratings.length,
            avgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
            minRating: ratings.length > 0 ? Math.min(...ratings) : 0,
            maxRating: ratings.length > 0 ? Math.max(...ratings) : 0
        };
    }
}