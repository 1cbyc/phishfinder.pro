import pandas as pd
from sklearn.model_selection import train_test_split

def load_data():
    # now i have to use the phisIIL dataset cause i could not manually sort
    data = pd.read_csv('data/phishIIL.csv')
    # phishing_df = pd.read_csv('data/phishing_urls.csv')
    # legit_df = pd.read_csv('data/legitimate_urls.csv')

    # i want to add a label colum: 1 for phishing and 0 for legit
    # phishing_df['label'] = 1
    # legit_df['label'] = 0
    # since this new dataset has "url" and "label" columns i will just update the column name based on what i read now
    data = data[['url', 'label']]
    # i changed my mind, let me just select relevant colums from the phishIIL dataset i used this way:
    features = data.drop(columns=['FILENAME', 'URL', 'label']) # so i will drop unnecessary columns like this
    target = data['label'].apply(lambda x: 1 if x == 'phishing' else 0)

    # since i want to make sure 'label' column is binary (1 for phishing, 0 for legitimate)
    data['label'] = data['label'].apply(lambda x: 1 if x == 'phishing' else 0) # encoding the label perfectly
    # so now i want to concatenate the datasets and shuffle it
    # data = pd.concat([phishing_df, legit_df]).sample(franc=1).reset_index(drop=True)
    # return data

    return features, target

# def split_data(data):
#     X = data['url'] # if i run it for the email, i will use 'email' instead of url (depending on the data i use)
    # y = data['label']
    # return train_test_split(X, y, test_size=0.2, random_state=42)
def split_data(features, target):
    return train_test_split(features, target, test_size=0.2, random_state=42)

# the plan now on this script is to load phishing and legit url data. then label the phishing data as 1 and legit as 0. then split the data into training and test sets.

