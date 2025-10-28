from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.pipeline import OneHotEncoder
from sklearn.impute import SimpleImputer

def preprocess_features(X_train, X_test):
    # i am trying to define which columns are numeric and which are categorical
    numeric_features = X_train.select_dtypes(include=['int64', 'float64']).columns
    categorical_features = X_train.select_dtypes(include=['object']).columns

    # starting to preprocess the pipelines for both types of features
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='mean')),
        ('scaler', StandardScaler())])
    
    categorical_tranformer =Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='mean')),
        ('scaler', StandardScaler())])
    
    # i want to  combine both transformers ion a preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_tranformer, categorical_features)
        ]
    )

    # i want to fit and transform the training data and transform test data
    X_train = preprocessor.fit_transform(X_train)
    X_test = preprocessor.transform(X_test)

    return X_train, X_test

# what i did here is to ensure all categorical features are encoded and normalize or scale numerical features if necessary.