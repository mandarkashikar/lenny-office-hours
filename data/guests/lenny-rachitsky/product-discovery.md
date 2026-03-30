# Lenny Rachitsky on Product Discovery
Source: A year free of PostHog ($16,500 value): The all-in-one analytics, experimentation, feature flag, surveys, session replay, error tracking, data warehouse, LLM analytics platform (2025-12-02); How GiveDirectly increased donations by over $3 million/year through experimentation (2024-12-03); Introducing DRICE: a modern prioritization framework (2023-11-07); Lenny’s Newsletter Holiday Gift Guide 2022 (2022-11-29); How to run SEO experiments (2020-12-15)

## Key passages

### Passage 1
"1. [Please, please don’t A/B test that](https://medium.com/@talraviv/please-please-dont-a-b-test-that-980a9630e4fb) (written by our very own community member [Tal Raviv](https://www.linkedin.com/in/talsraviv/?originalSubdomain=il)!)
2. [The hypothesis prioritization canvas](https://jeffgothelf.com/blog/the-hypothesis-prioritization-canvas/)
3. [Optimizely's sample size calculator](https://www.optimizely.com/sample-size-calculator/)
4."

### Passage 2
"1. **Setting up** an SEO experimentation framework
2. **Knowing** what to measure with SEO experiments
3. **Running** an SEO experiment
4."

### Passage 3
"1. **You’re familiar with SEO:** I’ll be talking about how to set up your experiments, and so assume some foundational knowledge of SEO. 2. **Organic traffic is already one of the main drivers of your business:** SEO experimentation is not intended to help you learn whether you *should* pursue SEO."

### Passage 4
"When you’re running an SEO experiment **you’re testing on the page level**. Thus, you need to have an experimentation system that can do your bucketing on the page level. Why is that? Because every time Google visits the site, it’ll count as a different user and get re-assigned to treatment or control."

### Passage 5
"1. As far as I’m aware, **bucketing by the page-level isn’t possible** on any of the major experimentation platforms, such as Optimizely. So you can’t really hack this together with existing solutions. 2."

### Passage 6
"**Keyword rankings**: Rankings change daily. You also don’t have visibility into all of the keywords that you’re ranking for. In addition, rankings also change based on your location. Whatever tool you’re using to get your ranking for a keyword isn’t going to be accurate enough for you to conclude your experiment."

### Passage 7
"**The ability to bucket your treatment and control on the page level:** You can bucket treatment/control by taking a hash of the canonical URL, or if your site is small enough manually bucketing it yourself by picking the URLs you want in control/treatment. As far as I’m aware, there are no out-of-the-box solutions that will allow you to do this. You will need to build this out yourself. - **The ability to track incoming organic traffic to your website**: This is more than just looking at Google Analytics."

### Passage 8
"Compare the expected change in traffic if you hadn’t run the experiment against the difference that you see now that you’ve made the change
- Since you bucketed your control and treatment randomly, you could end up with one bucket receiving more traffic than the other (e.g. in Airbnb’s case, one bucket might have more large cities than the other). By measuring the difference in difference, you’re accounting for the imbalance in traffic and measuring the impact independent of the raw traffic count. - Remember to pull out bot traffic from your data source."

### Passage 9
"1. [Jeff Chang’s Growth Blog](https://www.growthengblog.com/blog/2018/4/15/scaling-new-growth-opportunities-series-seo-basics): Jeff is one of the original growth engineers at Pinterest and was the Growth Tech Lead there. Airbnb’s experimentation framework is heavily borrowed from Pinterest. This is an extremely simple version of an SEO experimentation framework and may be your best option to roll something out quickly."

### Passage 10
"1. **Learning**: Experiments help you learn about your users
2. **Deciding**: Experiments tell you if your change had the intended consequence
3. **Avoiding**: Experiments catch unintended consequences
4."
