class GRUModel {
    constructor() {
        this.model = null;
        this.trainingHistory = [];
        this.isTrained = false;
        this.onEpochEnd = null;
    }

    createModel(inputShape) {
        const model = tf.sequential();
        
        model.add(tf.layers.gru({
            units: 64,
            activation: 'relu',
            returnSequences: false,
            inputShape: inputShape
        }));
        
        model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 1, activation: 'linear' }));
        
        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError',
            metrics: ['mse']
        });
        
        console.log('GRU Model created successfully');
        return model;
    }

    async trainModel(features, labels, epochs = 50, validationSplit = 0.2) {
        try {
            const xs = tf.tensor2d(features).reshape([features.length, 1, features[0].length]);
            const ys = tf.tensor2d(labels, [labels.length, 1]);

            if (!this.model) {
                this.model = this.createModel([1, features[0].length]);
            }

            const history = await this.model.fit(xs, ys, {
                epochs: epochs,
                batchSize: 16,
                validationSplit: validationSplit,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        this.trainingHistory.push(logs);
                        if (this.onEpochEnd && typeof this.onEpochEnd === 'function') {
                            this.onEpochEnd(epoch, logs);
                        }
                    }
                }
            });

            this.isTrained = true;
            
            xs.dispose();
            ys.dispose();

            return history;
            
        } catch (error) {
            console.error('Training error:', error);
            throw error;
        }
    }

    async predict(features) {
        if (!this.model || !this.isTrained) {
            throw new Error('Model not trained. Call trainModel() first.');
        }

        const xs = tf.tensor2d([features]).reshape([1, 1, features.length]);
        const prediction = this.model.predict(xs);
        const result = await prediction.data();
        
        xs.dispose();
        prediction.dispose();
        
        return result[0] * 10;
    }

    evaluateModel(testFeatures, testLabels) {
        const xs = tf.tensor2d(testFeatures).reshape([testFeatures.length, 1, testFeatures[0].length]);
        const ys = tf.tensor2d(testLabels, [testLabels.length, 1]);
        
        const evaluation = this.model.evaluate(xs, ys);
        const loss = evaluation[0].dataSync()[0];
        
        xs.dispose();
        ys.dispose();
        evaluation.forEach(tensor => tensor.dispose());
        
        return {
            loss: loss,
            rmse: Math.sqrt(loss) * 10
        };
    }

    getTrainingHistory() {
        return this.trainingHistory;
    }
}