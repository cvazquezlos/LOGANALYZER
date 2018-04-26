package elastest.loganalyzer.es.client.rest;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import elastest.loganalyzer.es.client.model.Log;
import elastest.loganalyzer.es.client.model.Project;
import elastest.loganalyzer.es.client.service.ExecutionService;
import elastest.loganalyzer.es.client.service.LogService;
import elastest.loganalyzer.es.client.service.ProjectService;

@RestController
@RequestMapping("/api/projects")
public class ProjectRest {

	@Autowired
	private ExecutionService executionService;
	@Autowired
	private LogService logService;
	@Autowired
	private ProjectService projectService;

	@RequestMapping(value = "", method = RequestMethod.GET)
	public ResponseEntity<List<Project>> getAll() {
		Iterable<Project> projects = projectService.findAll();
		List<Project> result = new ArrayList<Project>();
		for (Project project : projects) {
			result.add(project);
		}
		if (result.size() > 0) {
			return new ResponseEntity<>(result, HttpStatus.OK);	
		} else {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}
	}

	@RequestMapping(value = "/name/{name}", method = RequestMethod.GET)
	public ResponseEntity<Project> getByName(@PathVariable String name) {
		Project project = projectService.findByName(name);
		if (project != null) {
			return new ResponseEntity<>(project, HttpStatus.OK);	
		} else {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}
	}

	@RequestMapping(value = "", method = RequestMethod.POST, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Integer> post(@RequestBody Project project) {
		project.setRecently_deleted(-1);
		return new ResponseEntity<>(projectService.save(project), HttpStatus.CREATED);
	}

	@RequestMapping(value = "/id/{id}", method = RequestMethod.DELETE)
	public ResponseEntity<Project> deleteById(@PathVariable int id) {
		Project deleted = projectService.findOne(id);
		if (deleted != null) {
			List<Log> logs = logService.findByProject(deleted.getName());
			logService.deleteIterable(logs);
			executionService.deleteById(Integer.valueOf(logs.get(0).getTest()));
			projectService.delete(deleted);
			return new ResponseEntity<>(deleted, HttpStatus.OK);
		} else {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}
	}
}
