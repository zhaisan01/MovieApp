import React, { Component } from 'react';
import { Row, Tabs, Alert } from 'antd';
import ApiService from '../../services/api-service';
import FilmsList from '../films-list';
import SearchBlock from '../search-block';
import ErrorMessage from '../error-message';
import { GenresProvider } from '../../genres-list-context';
import './app.css';
import Spinner from '../spinner';
import PaginationBlock from '../pagination-block';
import Empty from '../empty';

const { TabPane } = Tabs;

export default class App extends Component {
	state = {
		items: null,
		ratedItems: [],
		genreList: null,
		loaded: true,
		error: false,
		query: '',
		page: 1,
		tabNum: 'search',
		ratedError: false,
	};

	componentDidMount = () => {
		this.initApplication();
	};

	initApplication = async () => {
		try {
			const genreListData = await ApiService.getGenres();
			this.setState({
				genreList: genreListData.genres,
			});

			await ApiService.getSessionId();

			this.setState({
				error: false,
			});

			const ratedMoviesData = await ApiService.getRatedMovies();
			this.setState({
				ratedItems: ratedMoviesData.results,
				loaded: true,
			});
		} catch (error) {
			this.setState({
				error: true,
				errorMessage: error.message,
				loaded: true,
			});
		}
	};

	onStartSearching = async (queryString) => {
		if (queryString.trim() === '') return;

		this.setState(() => ({
			query: queryString,
			loaded: false,
			page: 1,
			error: false,
		}));

		this.getFilmsItems(1);
	};

	getFilmsItems = (page) => {
		const { query } = this.state;

		ApiService.getMovies(query, page)
			.then((data) => {
				this.setState({
					items: data.results,
					loaded: true,
					totalResults: data.total_results,
				});
			})
			.catch((error) => {
				this.setState({
					error: true,
					errorMessage: error.message,
					loaded: true,
				});
			});
	};

	getPage = (page) => {
		this.setState({
			page,
			loaded: false,
		});

		this.getFilmsItems(page);
	};

	changeTab = (key) => {
		this.setState({
			tabNum: key,
		});
	};

	rateFilm = (rateValue, filmId) => {
		ApiService.rateMovie(rateValue, filmId)
			.then(() => {
				this.setState(({ ratedItems, items }) => ({
					ratedItems: [
						...ratedItems,
						{
							...items.filter((el) => el.id === filmId)[0],
							rating: rateValue,
						},
					],
				}));
			})
			.catch(() => {
				this.setState({
					ratedError: true,
				});

				setTimeout(() => {
					this.setState({
						ratedError: false,
					});
				}, 3000);
			});
	};

	popupError = () => {
		return (
			<div className="abs-error">
				<Alert message="???? ???????????????????? ?????????????? ??????????" type="error" showIcon />
			</div>
		);
	};

	render() {
		const {
			items,
			ratedItems,
			loaded,
			error,
			errorMessage,
			page,
			tabNum,
			query,
			genreList,
			totalResults,
			ratedError,
		} = this.state;

		const searchBlock = <SearchBlock query={query} onStartSearch={this.onStartSearching} />;
		const errorBlock = error ? <ErrorMessage message={errorMessage} /> : null;
		const spinner = !loaded ? <Spinner /> : null;
		const hasData = !(error || !loaded) && items;
		const pagination =
			hasData && items.length > 0 ? (
				<PaginationBlock hideOnSinglePage count={totalResults} currPage={page} onChange={this.getPage} />
			) : null;

		const elements = hasData ? (
			<FilmsList type={tabNum} items={items} ratedItems={ratedItems} rateFilm={this.rateFilm} />
		) : null;

		return (
			<div className="wrapper">
				<GenresProvider value={genreList}>
					<Tabs className="tab-panel" defaultActiveKey={tabNum} onChange={this.changeTab}>
						<TabPane tab="Search" key="search">
							<Row className="films-list">
								{ratedError && this.popupError()}
								{searchBlock}
								{errorBlock}
								{spinner}
								{elements}
								{pagination}
							</Row>
						</TabPane>
						<TabPane tab="Rated" key="rated">
							<Row className="films-list">
								{errorBlock}
								{ratedItems.length > 0 || spinner || <Empty />}
								{elements}
							</Row>
						</TabPane>
					</Tabs>
				</GenresProvider>
			</div>
		);
	}
}
