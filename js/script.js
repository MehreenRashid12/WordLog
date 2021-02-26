const base = 256; //for symbols in ascii

//WordList class will handle the json file

class WordList{
	size         //total words in the json file
	words        //english and bangla words in the json file
}

/*PerfectHash class will 
generate(for creating the hash table) and calculate(to search the hash table) 
the primary and secondary hash values*/

const prime = 999999999989; //declaring a 12 digit prime 

class PerfectHash{

	firsta=null;
	firstb=null ;    //firsta=firsb=null will indicate the hash table has not generated yet
	hashTable;       //this array will map the words initailly disregarding the collison
	secondaryKeys;   //this array will store the value of a,b,m for secondary hashing for each slot

	//this function will initialize hashtable and secondary keys array

	initialization(){
		this.hashTable = new Array(dictionary.size);
		this.secondaryKeys = new Array(dictionary.size);

		for(var i=0; i<dictionary.size; i++){
			this.hashTable[i]=[];
			this.secondaryKeys[i]=null;
		}
	}

	//this function will convert a word to a number

	stringToNumber(string){
		var stringKey = 0;

		for(var i=0; i<string.length; i++){

			stringKey = ((stringKey*base)%prime+string.charCodeAt(i))%prime;  //like cat = 99*256^2+97*256^1+116*256^0

		}

		return stringKey;


	}

	//this function will generate an unique value for each word

	getFirstKey(string){
		var a,b;
		a = 1+ Math.floor(Math.random()*(prime-1));
		b = Math.floor(Math.random()*prime);
		var stringKey = this.stringToNumber(string);

		//if the hash table is being generated

		if(this.firsta==null || this.firstb==null){
			this.firsta=a;
			this.firstb=b;
		}

		//if the hash table is already genrated
		//now searching is being conducted

		else{
			a=this.firsta;
			b=this.firstb;
		}

		var firstKey = (a*stringKey+b)%prime;  //(ak+b)%p

		return firstKey;
	}

	//this fuction will generate a primary hash value
	//two words can have the same primary hash value

	getPrimaryHash(string){
		return this.getFirstKey(string)%dictionary.size;  //((ak+b)%p)%m where m is the size of the dictionary
	}

	//this fuction will generate a second unique key in case of secondary hashing

	getSecondKey(a, b, m, string){

		var firstKey = this.getFirstKey(string);
		var secondKey = (a*firstKey+b)%prime;  //(ak'+b)%p

		return secondKey;

	}

	//this function will generate a secondary hash key

	getSecondaryHash(a, b, m, string){
		return this.getSecondKey(a,b,m,string)%m;  //((ak'+b)%p)%m where m is the square of the total number of words collided in the same slot 
	                                                
	}

	//to check if two words collide even after secondary hashing
	//here firstTable refers to the array hashTable[i]
	//and the secondTable refers to the secondary hash table

	haveCollied(a, b, m, firstTable, secondTable){
		for(var i=0; i<firstTable.length; i++){
			var secondaryHash = this.getSecondaryHash(a,b,m,dictionary.words[firstTable[i]].en);

			if(secondTable[secondaryHash] == null){
				secondTable[secondaryHash] = firstTable[i];
			}
			else{
				return true
			}
		}

		return false;

	}

	secondaryHashTable(mainTable, primaryHash){

		//mainTable is the array hashTable[i]
		var m = mainTable.length*mainTable.length;  //taking a square size will reduce the possibility of collison
		var secondTable = new Array(m); //the array where secondary hash will be generated

		//initializing the second table
		for(var i=0; i<m; i++){
			secondTable[i]=null;
		}

		var firstTable = Array.from(mainTable);  //copying the elements of the mainTable to another array to keep it unchanged
		var a,b;   //a & b are random variables which will generate the secondary hash
		a = 1+ Math.floor(Math.random()*(prime-1));
		b = Math.floor(Math.random()*prime);

		//this loop will continue until values of a & b are found so that no words collide in the secondary hash array
		while(this.haveCollied(a,b,m,firstTable,secondTable)){

			a = 1+ Math.floor(Math.random()*(prime-1));
			b = Math.floor(Math.random()*prime);

			secondTable.fill(null);  //if collision occurs secondTable has to initialized again

		}

		this.secondaryKeys[primaryHash] = [a,b,m];  //final values of a,b,m has to be stored in an array
		return secondTable;

	}

	//to check if a word appears twice in a slot
	//here checkTable is hashTable[i]

	isUnique(string, checkTable){

		for(var i=0; i<checkTable.length; i++){
			if(dictionary.words[checkTable[i]].en == string){
				return false;
			}
		}

		return true;

	}

	generateHashTable(){

		this.initialization();


		for(var i=0; i<dictionary.size; i++){
			dictionary.words[i].en = dictionary.words[i].en.toLowerCase(); //converting all words in the dictionary into lower case
			var string = dictionary.words[i].en;
			var primaryHash = this.getPrimaryHash(string);

			if(this.isUnique(string,this.hashTable[primaryHash])){

				this.hashTable[primaryHash].push(i);
			} 
		}

		for(var i=0; i<dictionary.size; i++){

			//if the length>1 collision has occurred and secondary hashing will be done
			if(this.hashTable[i].length > 1){

				this.hashTable[i] = this.secondaryHashTable(this.hashTable[i],i); 

			}

			//if there is no collision in the slot, no need for secondary hashing
			else if(this.hashTable[i].length == 1){
				this.secondaryKeys[i] = [1,0,1];
			}
		}

		console.log("HashTable generated");

	}

}

//creating class objects

var hash = new PerfectHash();

var dictionary = new WordList();


//this function will run when the web page loads 
window.onload = function run(){
	dictionary = fetch("https://raw.githubusercontent.com/MehreenRashid12/WordList/main/database/E2Bdatabase.json")  //accessing the json file
	.then(response =>{
		if(!response.ok){
			throw new Error(response.status);
		}

		return response.json()
	})

	.then(json => {
		dictionary.words = json;
		dictionary.size = Object.keys(dictionary.words).length;
		//console.log(dictionary.size);
	})

	.then(response =>{
		hash.generateHashTable();
	})

}

//accessing the html elements
const searchButton = document.getElementById("search-button");
const searchBox = document.getElementById("search-box");
const input = document.getElementById("given");
const result = document.getElementById("result");

//initiating the search function
searchButton.addEventListener('click',search);
searchBox.addEventListener('keypress',enter);

function enter(){
	if(event.keyCode == 13){
		search();
	}
}


//to search a word in the dictionary  
function search(){

	var searchWord = searchBox.value.toLowerCase();
	console.log(searchWord);
	var primaryHash = hash.getPrimaryHash(searchWord);

	try{
		if(hash.secondaryKeys[primaryHash] == null){
			throw 'Word Not Found';
		}

		var a = hash.secondaryKeys[primaryHash][0];
		var b = hash.secondaryKeys[primaryHash][1];
		var m = hash.secondaryKeys[primaryHash][2];

		var secondaryHash = hash.getSecondaryHash(a,b,m,searchWord);

		if(hash.hashTable[primaryHash][secondaryHash]!=null && dictionary.words[hash.hashTable[primaryHash][secondaryHash]].en == searchWord){
			input.innerHTML = searchWord;
			result.innerHTML = dictionary.words[hash.hashTable[primaryHash][secondaryHash]].bn;
		}
		else{
			throw 'Word Not Found';
		}
	}catch(err){
		input.innerHTML = searchWord;
		result.innerHTML = "Sorry, word not found :(";
	}	
	
}


