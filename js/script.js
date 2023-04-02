// constants
const FORM_FIELDS = [
    'num',
    'cource',
    'faculty',
    'studentCount',
    'email',
    'meta',
];

const UNIVERSITY_DATA_MAP = {
    num: 'Номер группы',
    cource: 'Курс',
    faculty: 'Факультет',
    studentCount: 'Количество студентов',
    email: 'Email',
    meta: 'Meta',
};

// classes
class DataBase {
    constructor (name, description) {
        this.dbName = name;
        const dbSize = 100 * 1024 * 1024;
        const dbVersion = '1.0';
        this.db = openDatabase(this.dbName, dbVersion, description, dbSize);
    }

    createTable(name, fieldMap) {
        let strFields = '';

        for (const [name, type] of fieldMap) {
            strFields += `, ${name} ${type}`;
        }

        this.db.transaction(tx => {
            tx.executeSql(`CREATE TABLE IF NOT exists '${name}'(id INTEGER primary key autoincrement${strFields})`);
        }, error => {
            console.log(error);
        });
    }

    insertToTable(name, obj) {
        const names = new Array();
        const q = new Array();
        const values = new Array();

        Object.keys(obj).forEach(key => names.push(key));
        Object.keys(obj).forEach(() => q.push('?'));
        Object.keys(obj).forEach(key => values.push(obj[key]));

        this.db.transaction(tx => {
            tx.executeSql(`INSERT INTO '${name}' (${names.join(', ')}) VALUES(${q.join(', ')})`, values);
        }, error => {
            console.log(error);
        });
    }

    async selectFromTable(name) {
        const sql = `SELECT * FROM '${name}'`;
        
        const loadingData = new Promise(resolve => {
            this.db.transaction(tx => {
                tx.executeSql(sql, [], (_, result) => {
                        resolve(result.rows);
                    }
                );
            }, error => {
                console.log(error);
            });
        });

        return await loadingData;
    }

    delete(name, key, value) {
        const sql = `DELETE FROM '${name}' WHERE ${key} = ${value}`;

        this.db.transaction(tx => {
            tx.executeSql(sql);
        });
    }
}

class GroupModel {
    obj;

    static tableName = 'group';

    static fieldMap = new Map([
        ['num', 'STRING'],
        ['cource', 'INTEGER'],
        ['faculty', 'STRING'],
        ['studentCount', 'INTEGER'],
        ['email', 'STRING'],
        ['meta', 'TEXT'],
    ]);

    constructor(num, cource, faculty, studentCount, email, meta) {
        this.obj = {
            num, cource, faculty, studentCount, email, meta
        };
    }

    save(db) {
        db.insertToTable(GroupModel.tableName, this.obj);
    }

    static async getAll(db) {
        return await db.selectFromTable(GroupModel.tableName);
    }

    static delete(db, groupNumber) {
        db.delete(GroupModel.tableName, 'num', groupNumber);
    }
}

class GroupRenderer {
    constructor(db) {
        this.db = db;
    }

    create(event, selector) {
        event.preventDefault();
        const form = event.target;

        const groupNumberValue = form.querySelector('#group_number').value;
        const groupCourceValue = form.querySelector('#group_cource').value;
        const groupFacultyValue = form.querySelector('#group_faculty').value;
        const groupStudentCountValue = form.querySelector('#student_count').value;
        const groupEmailValue = form.querySelector('#group_email').value;

        const metaObj = {};

        const additionalFields = Array.from(form.querySelectorAll('.group-additional'));
        const additionalFieldValues = Array.from(form.querySelectorAll('.group-additional-value'));

        additionalFields.forEach((field, index) => {
            metaObj[field.value] = additionalFieldValues[index].value;
        });

        const groupObj = new GroupModel(
            groupNumberValue,
            groupCourceValue,
            groupFacultyValue,
            groupStudentCountValue,
            groupEmailValue,
            JSON.stringify(metaObj),
        );

        groupObj.save(this.db);

        const groupOption = document.createElement('option');
        groupOption.value = groupNumberValue;
        groupOption.innerText = groupNumberValue;
        selector.appendChild(groupOption);
    }

    reset(event) {
        const form = event.target;
        form.reset();
    }

    addAdditionallField(event, rootContainer) {
        event.preventDefault();

        const fieldContainer = document.createElement('div');

        const fieldLabel = document.createElement('label');
        fieldLabel.classList.add("form-field__label");
        fieldLabel.innerText = "Дополнительное поле";
        fieldContainer.appendChild(fieldLabel);

        const fieldName = document.createElement('input');
        fieldName.classList.add("group-additional");
        fieldName.setAttribute("name", "group-additional");
        fieldName.setAttribute("type", "text");
        fieldName.setAttribute("pattern", "[a-z]{3,15}");
        fieldName.setAttribute("required", "");
        fieldContainer.appendChild(fieldName);

        const fieldValue = document.createElement('input');
        fieldValue.classList.add("group-additional-value");
        fieldValue.setAttribute("name", "group-additional-value");
        fieldValue.setAttribute("type", "text");
        fieldValue.setAttribute("required", "");
        fieldContainer.appendChild(fieldValue);

        rootContainer.appendChild(fieldContainer);
    }

    async initSelector(selector) {
        const groups = await GroupModel.getAll(this.db);

        Array.from(groups).forEach(group => {
            const groupOption = document.createElement('option');
            groupOption.value = group.num;
            groupOption.innerText = group.num;
            selector.appendChild(groupOption);
        });
    }

    async initTable(table, maxStudentCount = 1000) {
        table.replaceChildren();
        this._makeTableRow(table, UNIVERSITY_DATA_MAP);

        const groups = await GroupModel.getAll(this.db);
        Array.from(groups).filter(group => group.studentCount < maxStudentCount).forEach(group => {
            this._makeTableRow(table, group);
        });
    }

    _makeTableRow(table, source) {
        const tr = document.createElement('tr');

        FORM_FIELDS.forEach(key => {
            const th = document.createElement('th');

            th.appendChild(document.createTextNode(source[key]));
            tr.appendChild(th);
        });

        table.appendChild(tr);
    }

    delete(event, selector) {
        event.preventDefault();

        const groupNumber = selector.value;
        GroupModel.delete(this.db, groupNumber);
        // new API
        selector.replaceChildren(
            ...Array.from(selector.children).filter(child => child.value !== groupNumber)
        );
    }
}

(async function() {
	const database = new DataBase('NewUniversityDB', 'test university database');
    database.createTable(GroupModel.tableName, GroupModel.fieldMap);

    const groupRender = new GroupRenderer(database);

    //elements
    const createForm = document.querySelector('#create_group_form');
    const deleteForm = document.querySelector('#delete_group_form');

    const selector = document.querySelector('#group_id_for_delete');
    const additionalFieldContainer = document.querySelector('#additional-fields-container');
    const table = document.querySelector('#group_table');

    const additionalFieldAction = document.querySelector('#additional-fields-action');
    const studentFilter = document.querySelector('#student_filter');
    const studentFilterAll = document.querySelector('#student_filter_all');

    // init
    if (selector) {
        await groupRender.initSelector(selector);
    }

    if (table) {
        await groupRender.initTable(table);
    }

    // listeners
    if (createForm && deleteForm) {
        createForm.addEventListener('submit', (e) => groupRender.create(e, selector));
        createForm.addEventListener('reset', (e) => groupRender.reset(e));
        deleteForm.addEventListener('submit', (e) => groupRender.delete(e, selector));

        additionalFieldAction.addEventListener(
            'click', (e) => groupRender.addAdditionallField(e, additionalFieldContainer));
    }

    if (table) {
        studentFilter.addEventListener('click', async () => await groupRender.initTable(table, 20));
        studentFilterAll.addEventListener('click', async () => await groupRender.initTable(table));
    }
})();
