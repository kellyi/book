import { useState, useReducer } from "react";
import _ from "lodash";
import axios from "axios";
import {
  Box,
  Button,
  Header,
  Grommet,
  TextInput,
  Main,
  Image,
  Heading,
  Paragraph,
  List,
  Spinner,
} from "grommet";
import { FormSearch } from "grommet-icons";

const theme = {
  global: {
    font: {
      family: "Roboto",
      size: "18px",
      height: "20px",
    },
  },
};

const getValueFromEvent = ({ target: { value } }) => value;

const createApiUrl = (subject, startIndex) =>
  `https://www.googleapis.com/books/v1/volumes?q=subject=${subject}&maxResults=40&printType=books&startIndex=${startIndex}`;

const initialBookRequestState = {
  fetching: false,
  error: false,
  book: null,
};

const RESET_BOOK_REQUEST_STATE = "RESET_BOOK_REQUEST_STATE";
const START_BOOK_REQUEST = "START_BOOK_REQUEST";
const FAIL_BOOK_REQUEST = "FAIL_BOOK_REQUEST";
const COMPLETE_BOOK_REQUEST = "COMPLETE_BOOK_REQUEST";

const bookRequestReducer = (state = initialBookRequestState, action) => {
  switch (action.type) {
    case RESET_BOOK_REQUEST_STATE:
      return initialBookRequestState;
    case START_BOOK_REQUEST:
      return {
        fetching: true,
        error: false,
        book: null,
      };
    case FAIL_BOOK_REQUEST:
      return {
        ...state,
        fetching: false,
        error: true,
      };
    case COMPLETE_BOOK_REQUEST:
      return {
        ...state,
        fetching: false,
        error: false,
        book: action.payload,
      };
    default:
      return state;
  }
};

const structureDataFromBookObject = (book) => {
  const randomBookRecord = _.first(_.shuffle(_.get(book, ["data", "items"])));
  const bookVolumeInfo = _.get(randomBookRecord, ["volumeInfo"]);

  const isbn = (() => {
    const industryIdentifiers = _.get(bookVolumeInfo, ["industryIdentifiers"]);

    if (!industryIdentifiers) {
      return null;
    }

    const { identifier, type = "" } = _.last(industryIdentifiers);

    if (_.includes(type, "ISBN")) {
      return identifier;
    } else {
      return null;
    }
  })();

  return {
    totalItemsForSearch: _.get(book, ["data", "totalItems"]),
    title: _.get(bookVolumeInfo, ["title"]),
    authors: _.get(bookVolumeInfo, ["authors"]) || [],
    description: _.get(bookVolumeInfo, ["description"]),
    categories: _.get(bookVolumeInfo, ["categories"]) || [],
    publisher: _.get(bookVolumeInfo, ["publisher"]),
    publicationDate: _.get(bookVolumeInfo, ["publishedDate"]),
    smallThumbnail: _.get(bookVolumeInfo, ["imageLinks", "smallThumbnail"]),
    largeThumbnail: _.get(bookVolumeInfo, ["imageLinks", "thumbnail"]),
    googleBooksUrl: _.get(bookVolumeInfo, ["infoLink"]),
    isbn: isbn,
  };
};

const BookInfo = ({ book }) => {
  return (
    <Box
      align="center"
      pad={{ top: "small", left: "large", right: "large", bottom: "60px" }}
    >
      <Heading>{book.title}</Heading>
      <List
        margin={{ bottom: "small" }}
        primaryKey="field"
        secondaryKey="value"
        data={[
          {
            field: "Author/s",
            value: book.authors.join(', '),
          },
          {
            field: "Publisher",
            value: book.publisher,
          },
          {
            field: "Publication date",
            value: book.publicationDate,
          },
          {
            field: "ISBN",
            value: book.isbn || "unknown",
          },
          {
            field: "Categories",
            value: book.categories.join(', '),
          },
        ]}
      />
      <Paragraph>
        <a rel="noopener noreferrer" target="_blank" href={book.googleBooksUrl}>
          Learn more on Google Books
        </a>
      </Paragraph>
      <Paragraph margin={{ bottom: "55px" }}>{book.description}</Paragraph>
      <Paragraph>_</Paragraph>
    </Box>
  );
};

function App() {
  const [subject, setSubject] = useState("");
  const [bookRequestState, dispatch] = useReducer(
    bookRequestReducer,
    initialBookRequestState
  );

  const requestBook = () => {
    dispatch({ type: START_BOOK_REQUEST });

    new axios.get(createApiUrl(subject, 0))
      .then(
        ({ data: { totalItems } }) =>
          new axios.get(createApiUrl(subject, _.random(0, totalItems % 30)))
      )
      .then(structureDataFromBookObject)
      .then((payload) => dispatch({ payload, type: COMPLETE_BOOK_REQUEST }))
      .catch(() => dispatch({ type: FAIL_BOOK_REQUEST }));
  };

  const resetRequestState = () => dispatch({ type: RESET_BOOK_REQUEST_STATE });

  return (
    <Grommet full={true} theme={theme} className="application-body">
      <Header background="brand">
        <Box pad={{ top: "medium", bottom: "medium" }}></Box>
        <Box direction="row" pad="medium">
          <TextInput
            placeholder="Subject"
            value={subject}
            onChange={_.flow(getValueFromEvent, setSubject, resetRequestState)}
          />
          <Box
            pad="xsmall"
            background="white"
            margin={{ left: "small" }}
            className="powered-by-logo"
          >
            <Image
              fit="contain"
              src="https://books.google.com/googlebooks/images/poweredby.png"
              background="white"
            />
          </Box>
          <Button
            primary
            margin={{ left: "xsmall" }}
            icon={<FormSearch />}
            onClick={requestBook}
            disabled={bookRequestState.fetching}
          />
        </Box>
      </Header>
      <Main overflow="auto">
        {bookRequestState.error && (
          <Box align="center" pad="medium">
            <Paragraph>
              The request for {subject} encountered an error
            </Paragraph>
          </Box>
        )}
        {bookRequestState.fetching && <Box align="center" pad="medium"><Spinner size="medium" /></Box>}
        {bookRequestState.book && <BookInfo book={bookRequestState.book} />}
      </Main>
    </Grommet>
  );
}

export default App;
