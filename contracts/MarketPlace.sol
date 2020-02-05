pragma solidity ^0.4.0;
//pragma experimental ABIEncoderV2;

contract MarketPlace {
    constructor() public {}

    struct sFile {
        string Name;
        bytes32 Hash;
        bytes32 SwarmHash;
        uint Price;
        string Description;
        uint FileID;
        uint SellerID;
        address Owner;

    }

    enum statusDisput {empty,exist,close}

    struct oneOrder {// планируется для отслеживания подтверждения, что все получили чего хотели.
        //uint OrderID;
        uint FileID;
        address BayerAddress;
        bool OwnerApprove; // согласие завершение сделки со стороны владельца ресурса
        bool BayerApprove; // согласие завершение сделки со стороны покупателя
        uint FixPrise; // стоимость для фиксирования цены
        bool IsPayed;
        statusDisput ExistDisput;

    }

    struct arbitrator {
        address arbitratorAddress;
        // uint ID;
        uint DisputCount;
        uint Rating;
        uint Deposit; ///всю инфу хранитьтут мапинг по адресу на все данные арбитра
        bool Exist;
        //
    }

    //enum statusArbitr {set,};
    struct arbitrVote {
        bytes32 hash;
        bytes32 codeWord;

    }
    struct voting {
        mapping(address => arbitrVote) votes; //fixme если убрать!!!!!!!!!!!!!!
        uint endVoting;
        uint toOwner;
        uint toBayer;
    }

    struct disput {//todo: структура споров в массиве и id спора записывать продавцу
        uint DateCreate;
        address WhoCreate;
        string Complaint; //суть притензии
        string AnswerComplaint; // ответочка
        bool ConsentOwner;
        bool ConsentBayer;
        bool CallArbitr;
        string arbirtatorComment;
        voting Voting;
        address closedDispute_in_Favor;
        uint arbitrVoteCount;

    }
    //mapping(address=>uint[]) arbitrationDisputs; // не уверен что эир мне надо

    event NewFile(string _name, bytes32 _Hash, bytes32 _SwarmHash, uint _Price,
        string _Description, uint _FileID, uint _SellerID, address _owner);

    //  mapping(address => sFile[]) dbFile;
    sFile[] dbFiles;
    mapping(address => uint[]) sellerFileIDs;
    //mapping(uint => arbitrator[]) arbitratorDB; //ID арбитра на структуру с всеми данными по нему
    // address[] arbitratorID; //массив адресов арбитров номер - адрес
    // mapping(address => uint) deposit;

    oneOrder[] allOrders;
    arbitrator[] allArbitrator; //арбитры оставить в массиве !! на это есть основани например если !!! вдруг захочеш по ним пройтись циклом или кто другой
                                //не трогать длинный камент )) далой длинну строки доса 80 символов не придел ))
    mapping(address => uint) arbitr_to_id; //чисто для записи id апбитров

    mapping(uint => address) ownerOrdersID;
    mapping(uint => address) bayersOrdersID;
    mapping(address => uint) arbitratorID;
    mapping(uint => disput) allDisput;



    //disput[] allDisput; //сюда будем заносить споры fixme: переделать на mapping uint - > disput ( где uint orderID )
    //todo (возможно создать структуру покупателя с занесением информации о спорах)

    //mapping //идея заключается в сохранении номерСпора=>адбитры


    address[] allVendorsAtTheCurrentMoment; // для проверки: есть ли такой продавец
    // todo при создании файла нужно внести депозит
    function addFile(string _name, bytes32 _Hash, bytes32 _SwarmHash, uint _Price, string _Description) public {
        uint _fileCount = sellerFileIDs[msg.sender].length;
        uint _SellerID;
        if (_fileCount == 0) {
            _SellerID = allVendorsAtTheCurrentMoment.push(msg.sender);
        } else {
            uint[] memory sellerFilesIDs = sellerFileIDs[msg.sender];
            uint sellerFirstFileID = sellerFilesIDs[0];
            _SellerID = dbFiles[sellerFirstFileID].SellerID;
        }

        uint _FileID = dbFiles.length;
        dbFiles.push(sFile(_name, _Hash, _SwarmHash, _Price, _Description, _FileID, _SellerID, msg.sender));
        sellerFileIDs[msg.sender].push(_FileID);

        emit NewFile(_name, _Hash, _SwarmHash, _Price, _Description, _FileID, _SellerID, msg.sender);
    }

    //    function list() public view returns(sFile[]) {
    //        sFile[] memory _allfiles;
    //        for (uint i = 0; i < dbFiles.length; i++) {
    //            _allfiles.push(dbFiles[i]);
    //        }
    //        return _allfiles;
    //
    //    }


    event EventCreateOrder(uint _FileID, uint _orderID, uint _price);

    function createOrder(uint _FileID) public payable {
        sFile memory BayFile = dbFiles[_FileID];
        require(dbFiles.length >= _FileID, "Файл с указанным ID не существует");
        require(BayFile.Price <= msg.value, "given money should be greater than the price");
        uint _orderID = allOrders.push(oneOrder(_FileID, msg.sender, false, false, BayFile.Price, false, statusDisput.empty)) - 1;
        //0- статус спора; 0-ID спора
        ownerOrdersID[_orderID];
        bayersOrdersID[_orderID];
        emit EventCreateOrder(_FileID, _orderID, BayFile.Price);
    }

    event eventApproveOrder(bool _owner, bool bayer, string statusTransaktion);

    function approveOrder(uint _orderID, bool _approve) public {
        require(allOrders.length >= _orderID, "given unexisted orderID");
        //todo проверка открытого спора

        oneOrder storage _order = allOrders[_orderID];
        sFile memory _fileInfo = dbFiles[_order.FileID];
        address _owner = _fileInfo.Owner;
        require(msg.sender == _order.BayerAddress || msg.sender == _fileInfo.Owner, "wrong buyer or seller address");

        if (msg.sender == _order.BayerAddress) {
            _order.BayerApprove = _approve;
            emit eventApproveOrder(_order.OwnerApprove, _order.BayerApprove, "no transaction");
        }
        if (msg.sender == _owner) {
            _order.OwnerApprove = _approve;
            emit eventApproveOrder(_order.OwnerApprove, _order.BayerApprove, "no transaction");
        }
        // если она true вызвать closeOrder
        if (_order.OwnerApprove == true && _order.BayerApprove == true) {
            closeOrder(_orderID);
            emit eventApproveOrder(_order.OwnerApprove, _order.BayerApprove, "Transaction");
        }

    }

    function closeOrder(uint _orderID) private {
        oneOrder storage _order = allOrders[_orderID];
        require(_order.ExistDisput == statusDisput.empty);
        require(_order.IsPayed == false, "the order has been already payed");
// кучу проверок по открытию диспута
        uint amount = _order.FixPrise;
        address _owner = dbFiles[_order.FileID].Owner;

        if (_order.OwnerApprove == true && _order.BayerApprove == true) {
            _order.IsPayed = true;
            _owner.transfer(amount);
        }
    }

    function searchOrder(uint _fileID) view public returns (uint) {
        oneOrder memory _order;
        for (uint i = 0; i < allOrders.length; i++) {
            _order = allOrders[i];

            if (msg.sender != _order.BayerAddress) {
                continue;
            }

            if (_order.FileID == _fileID) {
                return i;
            }
            // кажись так цикл не остановить ((

        }
    }

    function canselOrder(uint _orderID) public {//todo создать функцию отмена заказа
        oneOrder storage _order = allOrders[_orderID];
        require(_order.OwnerApprove == false && _order.BayerApprove == false);
        require(_order.IsPayed == false, "the order has been already payed");
        require(_order.ExistDisput != statusDisput.exist);
        address _bayerAddress = _order.BayerAddress;
        require(_bayerAddress == msg.sender);
        uint amount = _order.FixPrise;
        _order.IsPayed = true;
        _bayerAddress.transfer(amount);
        emit eventApproveOrder(_order.OwnerApprove, _order.BayerApprove, "Transaction");

    }

    uint constant minArbitorDeposit = 10;

    function addDepositArbitrator() public payable { // нужен тест
        uint _ID1 = arbitratorID[msg.sender];
        require(allArbitrator[_ID1].Exist == true);
        allArbitrator[_ID1].Deposit += msg.value;
    }

    function becomeANarbitrator() public payable { //нужен тетт
        require(minArbitorDeposit <= msg.value);
        arbitratorID[msg.sender] = newArbitrator(msg.sender, msg.value);
    }

    function newArbitrator(address arbitr, uint _deposit) private returns (uint) { //тужен тест
            uint _id = allArbitrator.push(arbitrator({
            arbitratorAddress : arbitr,
            Deposit : _deposit,
            DisputCount : 0,
            Rating : 0,
            Exist : true
            })) - 1;
            arbitr_to_id[msg.sender] = _id;
            return (_id);
    }

    event createDisputEvent(uint _orderID, string _complaint, address _owner, address _bayer); //нужен тест

    function createDisput(uint _orderID, string _complaint) public {
        oneOrder storage _order = allOrders[_orderID];
        sFile storage _fileInfo = dbFiles[_order.FileID];
        require(_order.BayerAddress == msg.sender || _fileInfo.Owner == msg.sender);
        require(_order.ExistDisput == statusDisput.empty);
        _order.ExistDisput = statusDisput.exist;
        address _arbitrAddress;
        string memory _emptiString;
        voting memory emptyVoting;
      //  bytes32 _emptyHash;
        allDisput[_orderID] = disput({
            DateCreate: now,
            WhoCreate: msg.sender,
            Complaint: _complaint,
            AnswerComplaint: _emptiString,
            ConsentOwner: false,
            ConsentBayer: false,
            CallArbitr: false,
            arbirtatorComment: _emptiString,
            Voting: emptyVoting,
            closedDispute_in_Favor: _arbitrAddress,
            arbitrVoteCount: 0
            });
        //todo обращаемся к базе арбитров и назначаем 3х красавцев
    }

    function callArbitrator (uint _orderID, string _comments) public { //нужен тест
        disput storage _disput = allDisput[_orderID];
        require(_disput.CallArbitr == false);
        require(_disput.DateCreate + 10 days < now);
        setArbitr(_orderID);
        _disput.arbirtatorComment = _comments;
        _disput.CallArbitr = true;

    }

    function setArbitr (uint _orderID) public returns(uint){ ///Нужен выбор арбитров
        // каким-то образом идет выбор арбитров возвращается целое число
        uint _chose = 1; //todo: поменять на вызов рандомайзера
        address _arbitr = allArbitrator[_chose].arbitratorAddress;
        disput storage _disput = allDisput[_orderID];
        arbitrVote memory _arbitrVote;
        _disput.Voting.votes[_arbitr] = _arbitrVote; //todo: в структцры voting надо бодавить что-то !!!!

    }



    // a arbitr voting commit stage
// fixme голосование ____ отметка все что ниже надо редактировать
// fixme

            event endCommit(uint _orderID, string _textClose);// заставить подписаться !!!!!!!!

    function votingArbitr (uint _orderID, bytes32 _hash) public  {
        require(_disput.arbitrVoteCount < 3);
        disput storage _disput = allDisput[_orderID];
        _disput.Voting.votes[msg.sender].hash = _hash;

        if (_disput.arbitrVoteCount < 3) {
            _disput.arbitrVoteCount++;
        } else {
            emit endCommit(_orderID, "All 3 arbitr vote");
        }
    }

    function reveal(uint _orderID, address _voteTo, bytes32 _word) public {
        disput storage _disput = allDisput[_orderID];
        require(_disput.arbitrVoteCount == 3);
        //arbitrVote memory _arbitrVote = _disput.Voting.votes[msg.sender];
        address _bayer = allOrders[_orderID].BayerAddress;

        oneOrder storage _order = allOrders[_orderID];
        sFile memory _fileInfo = dbFiles[_order.FileID];
        address _owner = _fileInfo.Owner;

        bytes32 _firstHash = _disput.Voting.votes[msg.sender].hash;
        bytes32 _secondHash = hashVote(_orderID, _voteTo, _word);

        if (_firstHash != _secondHash){
             return;
        }

        _disput.Voting.votes[msg.sender].codeWord = _word;

        if(_bayer == _voteTo){
            _disput.Voting.toBayer++;
        }
        if(_owner == _voteTo ){
            _disput.Voting.toOwner++;
        }

        if(_disput.Voting.toBayer+_disput.Voting.toOwner == 3){
            _order.ExistDisput = statusDisput.close;

            closeOrderWithDisput(_orderID, _disput.Voting.toBayer>_disput.Voting.toOwner);
        }

    }

    function closeOrderWithDisput(uint _orderID, bool _isBuyerWins){
        oneOrder storage _order = allOrders[_orderID];
        require(_order.ExistDisput == statusDisput.close);

    }


    function hashVote(uint _orderID, address _voteTo, bytes32 _word) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_orderID, _voteTo, _word));
    }




}