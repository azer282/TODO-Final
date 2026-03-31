FROM cypress/included:13.17.0
WORKDIR /e2e
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ENV CYPRESS_baseUrl=http://frontend
ENV CYPRESS_API_BASE_URL=http://backend:3087
CMD ["cypress", "run"]
