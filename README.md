**

## Multi Customer Deployment

 - Create a FireStore database for customer in GCP Project 
 - Create a customer specific env file and add below 
	 - VITE_FIREBASE_DATABASE_ID=[New database ID]
	 - SERVICE_NAME=[Cloud rund name for this service]
	 - VITE_FIREBASE_STORAGE_BUCKET=[Storage bucket for customer] 
	 - VITE_AI_API_KEY=[API Key for customer to keep billing Separate] 
	 
 -Export firestore indexes using below command 
		 **firebase  firestore:indexes  >  firestore.indexes.json**
		 
 - In firebase.json add below section 
	 - { 
		 "database": "finistry-db",
		 "rules": "firestore.rules",
		 "indexes": "firestore.indexes.json"
	 }
 - Run below command to deploy rules and indexes 
	 firebase deploy --only firestore -P [GCP Project name]
